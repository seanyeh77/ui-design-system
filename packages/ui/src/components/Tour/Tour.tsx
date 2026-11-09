import * as React from 'react';
import { useReturnFocus } from '../../internal/focus';
import { Popover } from '@base-ui/react/popover';
import { CodeText } from '../InlineCode/InlineCode';
import { Button } from '../Button/Button';
import { tr } from '../../i18n';
import { announce } from '../../announce';
import { cx, seenOnly, store } from '../../internal/util';
import { devWarn } from '../../internal/dev';

export interface TourStep {
  /** A data-tour name ('search' matches [data-tour="search"]), a CSS selector (first visible match), a ref or an element.
   *  Leave it out for a step in the middle of the screen. */
  target?: string | React.RefObject<Element | null> | Element;
  /** Names the part: 「搜尋」. */
  title: string;
  /** What it does, 1 short sentence; `backticks` are code. */
  text: string;
  /** Default 'bottom'; flips when there is no room. The card never covers the target: with no room above or below,
   *  the page scrolls to make room (above a target taller than the window), else the card goes right or left of it;
   *  only when none of that works does it sit inside the target, at the bottom. */
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

/** Where the card goes for a highlighted box: the preferred side, the other one, then right or left of the box; inside
 *  the box at the bottom only when none has room (the tour scrolls first to make room above or below, see makeRoom).
 *  Returns the anchor line the card is placed against. */
function placeCard(rect: Box | null, cardH: number, prefer: 'bottom' | 'top', area?: { top: number; bottom: number }, cardW = 320) {
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
  // Beside it: the card's height must fit the window, its width the space next to the box.
  const vw = typeof window === 'undefined' ? 0 : window.innerWidth;
  const tallOk = cardH + 2 * margin <= vh - vt;
  const beside = (['right', 'left'] as const).find(
    (sd) => tallOk && (sd === 'right' ? rect.left + rect.width + GAP + cardW + margin <= vw : rect.left - GAP - cardW - margin >= 0),
  );
  if (beside) return { mode: beside, side: beside, offset: GAP, margin, line: rect };
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
  const [cardW, setCardW] = React.useState(320);
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
  useReturnFocus(open);
  // A new step after 下一步 or 上一步: its count, title and text are read (focus stays on the button, which does not read
  // them). The first step is read as the dialog opens.
  const shownStep = React.useRef(-1);
  React.useEffect(() => {
    if (!open || !step) {
      shownStep.current = -1;
      return;
    }
    if (shownStep.current !== -1 && shownStep.current !== i)
      announce(tr('第 {a} 步，共 {b} 步', { a: i + 1, b: steps.length }) + tr('。') + step.title + tr('。') + step.text.replace(/`/g, ''));
    shownStep.current = i;
  }, [open, i, step, steps.length]);
  const cardEl = React.useRef<HTMLDivElement | null>(null);
  // Tab and Shift+Tab go round the card's buttons only. Base UI's popover leaves focus guards around the card (no
  // name) that let Tab reach the page; focus that gets out anyway (a click on the dimmed page) comes back to 下一步.
  const tabbables = () =>
    Array.from(
      cardEl.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? [],
    ).filter((e) => e.getClientRects().length > 0);
  const onTab = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey) return;
    const list = tabbables();
    if (!list.length) return;
    e.preventDefault();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const to = at < 0 ? 0 : (at + (e.shiftKey ? -1 : 1) + list.length) % list.length;
    list[to].focus();
  };
  React.useEffect(() => {
    if (!open) return;
    const back = (e: FocusEvent) => {
      const box = cardEl.current;
      if (!box || !(e.target instanceof Node) || box.contains(e.target)) return;
      (next.current ?? tabbables()[0])?.focus();
    };
    document.addEventListener('focusin', back);
    return () => document.removeEventListener('focusin', back);
  }, [open]);

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
    // A target as tall as the window leaves no room beside it: the card has to cover part of it.
    devWarn(
      el && el.getBoundingClientRect().height > window.innerHeight * 0.7,
      'Tour',
      `第 ${i + 1} 步的目標「${target}」比視窗的 70% 高，說明卡只能蓋住它的一部分。請把 data-tour 放在較小的元素上，例如要說明的那張卡片或那一列，而不是整頁。`,
    );
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
    cardEl.current = el;
    observer.current?.disconnect();
    observer.current = null;
    if (!el) return;
    const measure = () => {
      setCardH(el.offsetHeight);
      setCardW(el.offsetWidth);
    };
    measure();
    observer.current = new ResizeObserver(measure);
    observer.current.observe(el);
  }, []);

  // Make room for the card (per step, again when its height changes: its width, and so its height, depends on where it
  // goes): with no room above or below the target, the page
  // scrolls so the target's top sits just under the window's top when the target and the card fit together, card
  // below; when they do not (a target taller than the window), so the card fits above the target. The card then
  // covers no part of the target.
  const measured = cardH > 0;
  React.useEffect(() => {
    if (!open || !hasStep || !measured) return;
    const el = findTarget(target);
    if (!(el instanceof HTMLElement)) return;
    const ar = bounds(el);
    const m = edge();
    const r = el.getBoundingClientRect();
    const top = r.top - pad;
    const bottom = r.bottom + pad;
    if (bottom + GAP + cardH + m <= ar.bottom || top - GAP - cardH - m >= ar.top) return;
    const together = bottom - top + GAP + cardH + 2 * m <= ar.bottom - ar.top;
    const want = together ? ar.top + m + pad : ar.top + m + cardH + GAP + pad;
    // The nearest box that scrolls (AppShell's main), else the window, moves by exactly the difference.
    let box: HTMLElement | null = el.parentElement;
    while (box && !(/(auto|scroll)/.test(getComputedStyle(box).overflowY) && box.scrollHeight > box.clientHeight)) box = box.parentElement;
    const dy = r.top - want;
    if (box) box.scrollBy({ top: dy, behavior: 'auto' });
    else window.scrollBy({ top: dy, behavior: 'auto' });
  }, [open, hasStep, i, target, pad, measured, cardH]);

  const area = open && step ? bounds(findTarget(step.target)) : undefined;
  const place = placeCard(rect, cardH, step?.side ?? 'bottom', area, cardW);
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
          // Beside the box, it shifts up or down to stay inside the window.
          collisionAvoidance={{ side: 'none', align: 'shift', fallbackAxisSide: 'none' }}
        >
          <Popover.Popup ref={card} key={i} className="ui-tour-card" data-placement={place.mode} initialFocus={next} onKeyDown={onTab}>
            {/* Taller than the window (phones): this part scrolls, the buttons stay at the bottom. */}
            <div className="ui-tour-body">
              <div className="ui-tour-count">
                {/* Shown 「1 / 5」, drawn by CSS; read and copied as 「第 1 步，共 5 步」, not 「1 斜線 5」. */}
                <span aria-hidden="true">{seenOnly(tr('{n} / {total}', { n: '\u0001', total: '\u0002' }), [String(i + 1), String(steps.length)])}</span>
                <span className="ui-visually-hidden">{tr('第 {a} 步，共 {b} 步', { a: i + 1, b: steps.length })}</span>
              </div>
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
