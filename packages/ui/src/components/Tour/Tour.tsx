import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { CodeText } from '../InlineCode/InlineCode';
import { Button } from '../Button/Button';
import { tr } from '../../i18n';
import { cx, monoNums, store } from '../../internal/util';

export interface TourStep {
  /** A data-tour name ('search' matches [data-tour="search"]), a CSS selector (first visible match), a ref or an element.
   *  Leave it out for a step in the middle of the screen. */
  target?: string | React.RefObject<Element | null> | Element;
  /** Names the part: 「搜尋」. */
  title: string;
  /** What it does, 1 short sentence; `backticks` are code. */
  text: string;
  /** Default 'bottom'; flips when there is no room. When neither side fits (a target about as tall as the window),
   *  the card sits inside the target, at the bottom center of the window. */
  side?: 'bottom' | 'top';
  /** Space around the highlighted part in px. Default 6. */
  padding?: number;
}

export interface TourProps {
  open: boolean;
  steps: TourStep[];
  onClose?: (reason: 'done' | 'skip') => void;
  /** 「略過」 and Esc end the tour early. Default true. */
  skippable?: boolean;
  /** Controlled step index. */
  step?: number;
  onStepChange?: (index: number) => void;
}

const TOUR_KEY = 'ui-tour:';

/** Opens the tour once per browser: { open, start, close, seen }. Pass close to Tour's onClose; start() shows it again. */
export function useTour(key: string) {
  const [open, setOpen] = React.useState(() => !store(TOUR_KEY + key));
  return {
    open,
    start: () => setOpen(true),
    close: () => {
      store(TOUR_KEY + key, '1');
      setOpen(false);
    },
    seen: !!store(TOUR_KEY + key),
  };
}

function findTarget(t: TourStep['target']): Element | null {
  if (!t) return null;
  if (typeof t === 'string') {
    const sel = /^[\w-]+$/.test(t) && !/^(html|body|main|nav|header|footer|section|aside)$/.test(t) ? `[data-tour="${t}"]` : t;
    return Array.from(document.querySelectorAll(sel)).find((e) => e.getClientRects().length > 0) ?? null;
  }
  return t instanceof Element ? t : t.current;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

const GAP = 12;

/** The space kept between the card and the window edges: the --space-3 token. */
function edge() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-3')) || 12;
}

const narrowNow = () => typeof window !== 'undefined' && window.innerWidth < 600;

/** The part of the window between a phone's fixed top bar and bottom tab bar (when the target is not one of them):
 *  the card stays inside it and never covers either bar. The whole window elsewhere. */
function bounds(target: Element | null): { top: number; bottom: number } {
  const vh = typeof window === 'undefined' ? 0 : window.innerHeight;
  if (!narrowNow()) return { top: 0, bottom: vh };
  let top = 0;
  let bottom = vh;
  const head = document.querySelector('.ui-shell-top');
  const bar = document.querySelector('.ui-tabbar');
  if (head && !(target && head.contains(target))) {
    const r = head.getBoundingClientRect();
    if (r.height && r.bottom > 0 && r.bottom < vh / 2) top = r.bottom;
  }
  if (bar && !(target && bar.contains(target))) {
    const r = bar.getBoundingClientRect();
    if (r.height && r.top > vh / 2 && r.top < vh) bottom = r.top;
  }
  return { top, bottom };
}

/** Where the card goes for a highlighted box: the preferred side, the other side, or inside the box at the bottom
 *  center of the window when neither side has room. Returns the anchor line the card is placed against. */
function placeCard(rect: Box | null, cardH: number, prefer: 'bottom' | 'top', area?: { top: number; bottom: number }) {
  const margin = typeof document === 'undefined' ? 12 : edge();
  const vh = area?.bottom ?? (typeof window === 'undefined' ? 0 : window.innerHeight);
  const vt = area?.top ?? 0;
  const fits = (side: 'bottom' | 'top') =>
    rect ? (side === 'bottom' ? rect.top + rect.height + GAP + cardH + margin <= vh : rect.top - GAP - cardH - margin >= vt) : false;
  if (!rect) {
    // No target: centered in the window.
    const top = Math.max(vt + margin + cardH, (vt + vh) / 2 + cardH / 2);
    return { mode: 'center', side: 'top' as const, offset: 0, margin, line: { left: 0, top, width: window.innerWidth, height: 0 } };
  }
  const other = prefer === 'bottom' ? 'top' : 'bottom';
  const side = fits(prefer) ? prefer : fits(other) ? other : null;
  if (side) return { mode: side, side, offset: GAP, margin, line: rect };
  // Inside the target, at its bottom edge or the window's (the box is clipped a few px inside the window), minus the
  // margin, never above the window's top margin.
  const end = rect.top + rect.height;
  const bottom = Math.max(vt + margin + cardH, end >= vh - margin ? vh - margin : end - margin);
  return { mode: 'inside', side: 'top' as const, offset: 0, margin, line: { left: rect.left, top: bottom, width: rect.width, height: 0 } };
}

/** The first-use walkthrough: the page goes dark except the part being introduced, with a card beside it. */
export function Tour({ open, steps, onClose, skippable = true, step: controlled, onStepChange }: TourProps) {
  const [inner, setInner] = React.useState(0);
  const i = Math.max(0, Math.min(steps.length - 1, controlled ?? inner));
  const step = steps[i];
  const [rect, setRect] = React.useState<Box | null>(null);
  const next = React.useRef<HTMLButtonElement>(null);
  const [cardH, setCardH] = React.useState(0);
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && controlled == null) setInner(0);
  }
  const go = (n: number) => {
    onStepChange?.(n);
    if (controlled == null) setInner(n);
  };
  const end = (why: 'done' | 'skip') => onClose?.(why);

  // Follow the target while it moves (scrolling, layout changes).
  // Depends on the step's fields, not the object: inline steps arrays are new on every render.
  const target = step?.target;
  const pad = step?.padding ?? 6;
  const hasStep = !!step;
  React.useEffect(() => {
    if (!open || !hasStep) return;
    // A selector is looked up again until it appears (the target may render later), then kept.
    let el = findTarget(target);
    // Bring the target into view first; one taller than the window shows from its top. On a phone the target goes
    // to the top, just under the top bar, so the card fits below it instead of covering it. The jump is instant: the
    // modal's scroll lock stops a smooth scroll halfway; the spotlight's own transition shows the move.
    const tall = (el?.getBoundingClientRect().height ?? 0) > window.innerHeight;
    if (el instanceof HTMLElement && narrowNow()) {
      const keep = el.style.scrollMarginTop;
      el.style.scrollMarginTop = bounds(el).top + edge() + pad + 'px';
      el.scrollIntoView?.({ block: 'start', behavior: 'auto' });
      el.style.scrollMarginTop = keep;
    } else el?.scrollIntoView?.({ block: tall ? 'start' : 'center', behavior: 'auto' });
    let raf = 0;
    let last = '';
    const tick = () => {
      if (!el?.isConnected) el = findTarget(target);
      const r = el?.getBoundingClientRect();
      let v: Box | null = null;
      if (r && r.width) {
        const l = Math.max(3, r.left - pad);
        const t = Math.max(3, r.top - pad);
        v = {
          left: l,
          top: t,
          width: Math.max(0, Math.min(window.innerWidth - 3, r.right + pad) - l),
          height: Math.max(0, Math.min(window.innerHeight - 3, r.bottom + pad) - t),
        };
      }
      const k = JSON.stringify(v);
      if (k !== last) {
        last = k;
        setRect(v);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [open, hasStep, i, target, pad]);

  // The card's height decides where it fits. The popup mounts after the first render (in a portal), so it is measured
  // through a callback ref when it appears, and again on every resize.
  const observer = React.useRef<ResizeObserver | null>(null);
  const card = React.useCallback((el: HTMLDivElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!el) return;
    const measure = () => setCardH(el.offsetHeight);
    measure();
    observer.current = new ResizeObserver(measure);
    observer.current.observe(el);
  }, []);

  const area = open && step ? bounds(findTarget(step.target)) : undefined;
  const place = placeCard(rect, cardH, step?.side ?? 'bottom', area);
  const line = place.line;
  const anchor = React.useMemo(
    () => ({
      getBoundingClientRect: () =>
        line ? new DOMRect(line.left, line.top, line.width, line.height) : new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0),
    }),
    [line?.left, line?.top, line?.width, line?.height], // eslint-disable-line react-hooks/exhaustive-deps
  );
  if (!open || !step) return null;
  const lastStep = i === steps.length - 1;
  return (
    <Popover.Root
      open
      modal
      onOpenChange={(_, details) => {
        if (details.reason === 'escape-key' && skippable) end('skip');
      }}
    >
      <Popover.Portal>
        <div className="ui-tour-layer">
          <div className={cx('ui-tour-block', !rect && 'is-dim')} />
          {rect ? <div className="ui-tour-spot" aria-hidden="true" style={rect} /> : null}
        </div>
        <Popover.Positioner
          className="ui-float ui-tour-float"
          anchor={anchor}
          side={place.side}
          align="center"
          sideOffset={place.offset}
          collisionPadding={place.margin}
          // The side is chosen above; Base UI only keeps the card inside the window horizontally.
          collisionAvoidance={{ side: 'none', align: 'shift', fallbackAxisSide: 'none' }}
        >
          <Popover.Popup ref={card} key={i} className="ui-tour-card" data-placement={place.mode} initialFocus={next}>
            {/* Taller than the window (phones): this part scrolls, the buttons stay at the bottom. */}
            <div className="ui-tour-body">
              <div className="ui-tour-count">{monoNums(tr('{n} / {total}', { n: '\u0001', total: '\u0002' }), [i + 1, steps.length])}</div>
              <Popover.Title className="ui-tour-title">{step.title}</Popover.Title>
              <CodeText as="div" className="ui-tour-text" text={step.text} />
            </div>
            <div className="ui-tour-actions">
              {skippable && !lastStep ? (
                <button type="button" className="ui-link-btn is-muted" onClick={() => end('skip')}>
                  {tr('略過')}
                </button>
              ) : null}
              <span className="ui-tour-gap" />
              {i > 0 ? <Button onClick={() => go(i - 1)}>{tr('上一步')}</Button> : null}
              <Button ref={next} variant="primary" onClick={() => (lastStep ? end('done') : go(i + 1))}>
                {lastStep ? tr('完成') : tr('下一步')}
              </Button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
