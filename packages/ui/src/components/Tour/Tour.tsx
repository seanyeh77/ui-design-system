import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { CodeText } from '../InlineCode/InlineCode';
import { Button } from '../Button/Button';
import { tr } from '../../i18n';
import { cx, monoNums, reduced, store } from '../../internal/util';

export interface TourStep {
  /** A data-tour name ('search' matches [data-tour="search"]), a CSS selector (first visible match), a ref or an element.
   *  Leave it out for a step in the middle of the screen. */
  target?: string | React.RefObject<Element | null> | Element;
  /** Names the part: 「搜尋」. */
  title: string;
  /** What it does, 1 short sentence; `backticks` are code. */
  text: string;
  /** Default 'bottom'; flips when there is no room. */
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

/** The first-use walkthrough: the page goes dark except the part being introduced, with a card beside it. */
export function Tour({ open, steps, onClose, skippable = true, step: controlled, onStepChange }: TourProps) {
  const [inner, setInner] = React.useState(0);
  const i = Math.max(0, Math.min(steps.length - 1, controlled ?? inner));
  const step = steps[i];
  const [rect, setRect] = React.useState<Box | null>(null);
  const next = React.useRef<HTMLButtonElement>(null);
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
  React.useEffect(() => {
    if (!open || !step) return;
    findTarget(step.target)?.scrollIntoView?.({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    let raf = 0;
    let last = '';
    const tick = () => {
      const r = findTarget(step.target)?.getBoundingClientRect();
      const pad = step.padding ?? 6;
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
  }, [open, step]);

  const anchor = React.useMemo(
    () => ({
      getBoundingClientRect: () =>
        rect ? new DOMRect(rect.left, rect.top, rect.width, rect.height) : new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0),
    }),
    [rect],
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
          side={rect ? (step.side ?? 'bottom') : 'bottom'}
          align="center"
          sideOffset={rect ? 12 : -100}
        >
          <Popover.Popup key={i} className="ui-tour-card" initialFocus={next}>
            <div className="ui-tour-count">{monoNums(tr('{n} / {total}', { n: '\u0001', total: '\u0002' }), [i + 1, steps.length])}</div>
            <Popover.Title className="ui-tour-title">{step.title}</Popover.Title>
            <CodeText as="div" className="ui-tour-text" text={step.text} />
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
