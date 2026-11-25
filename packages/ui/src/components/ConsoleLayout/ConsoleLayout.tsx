import * as React from 'react';
import { IconButton } from '../IconButton/IconButton';
import { cx } from '../../internal/util';
import { tr } from '../../i18n';
import { includeIcons } from '../../icons/store';
import phCornersIn from '../../icons/ph/corners-in';
import phCornersOut from '../../icons/ph/corners-out';

includeIcons(phCornersIn, phCornersOut);

/** A card that shows only when the screen is tall enough. */
export interface ConsoleExtra {
  /** Stable key for the card. */
  id: string;
  /** The card shows when the layout's logical height (the screen height divided by the zoom) is at least this many
   *  px, e.g. 1040. */
  minHeight: number;
  /** The card: usually a Card. */
  node: React.ReactNode;
}

export interface ConsoleLayoutProps {
  /** The product or screen name, the page's only heading: 「設施監控」. */
  title: string;
  /** Right after the title: a Tag 「示範資料」 with the info icon. Same size and color as the text around it. */
  tags?: React.ReactNode;
  /** Right side, before the KPIs: one short state in plain words, 「AI 最佳化中」. Shown in body size and ink color;
   *  pass plain text, not a Badge. */
  status?: React.ReactNode;
  /** Right side: `<KpiCard size="compact" />` side by side. In the top bar they lose their card look and sit between
   *  1 px lines. */
  kpis?: React.ReactNode;
  /** Right side, after the KPIs: the time and whether it is live, 「16:24 即時」. */
  clock?: React.ReactNode;
  /** A 「全螢幕」 button at the right end (Fullscreen API). Default true; hidden where the browser has no full screen. */
  fullscreen?: boolean;
  /** The main view, left of the side panel; it fills its cell (pass one Card, e.g. with a ZoneMap). */
  main: React.ReactNode;
  /** The side panel, 400 px (360 px under 1280 px): cards from top to bottom (TimeControl, EventTimeline). When they
   *  do not fit, the side panel scrolls on its own; the page never does. */
  side?: React.ReactNode;
  /** The bottom row under the main view, as tall as its content: e.g. a LineChart in a Card. The main view takes the
   *  height that is left. */
  bottom?: React.ReactNode;
  /** Cards added at the end of the side panel on tall screens: `[{ id, minHeight: 1040, node }]`. */
  extras?: ConsoleExtra[];
  className?: string;
}

/** Design size: at this size and up the layout zooms in. */
const BASE_W = 1440;
const BASE_H = 900;
const MAX_ZOOM = 1.5;
const PHONE = 600;

/** Zoom for a screen of w × h px: 1 up to 1440 × 900, then grows with the screen, at most 1.5. */
export function consoleZoom(w: number, h: number): number {
  return Math.max(1, Math.min(MAX_ZOOM, Math.min(w / BASE_W, h / BASE_H)));
}

/** A full-screen monitoring layout: a top bar (title, tags, then status, KPIs, clock and full screen on the right),
 *  the main view with a side panel beside it and a bottom row under it, filling the screen without scrolling. From
 *  1440 × 900 up everything zooms with the screen (at most 1.5×). Phones (under 600 px) get one scrolling column. */
export function ConsoleLayout({ title, tags, status, kpis, clock, fullscreen = true, main, side, bottom, extras, className }: ConsoleLayoutProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState<{ w: number; h: number } | null>(null);
  const [full, setFull] = React.useState(false);
  const canFull = typeof document !== 'undefined' && document.fullscreenEnabled === true;

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    const f = () => setFull(document.fullscreenElement != null && document.fullscreenElement === ref.current);
    document.addEventListener('fullscreenchange', f);
    return () => document.removeEventListener('fullscreenchange', f);
  }, []);

  const toggleFull = () => {
    const el = ref.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void el.requestFullscreen().catch(() => undefined);
  };

  const phone = size != null && size.w < PHONE;
  const zoom = size && !phone ? consoleZoom(size.w, size.h) : 1;
  const logicalH = size ? size.h / zoom : 0;
  const shown = (extras ?? []).filter((x) => phone || logicalH >= x.minHeight);
  const frameStyle: React.CSSProperties | undefined =
    size && !phone && zoom !== 1 ? ({ zoom, width: size.w / zoom, height: size.h / zoom } as React.CSSProperties) : undefined;

  const top = (
    <header className="ui-console-top">
      <div className="ui-console-start">
        <h1 className="ui-console-title">{title}</h1>
        {tags}
      </div>
      <div className="ui-console-end">
        {status != null ? <span className="ui-console-status">{status}</span> : null}
        {kpis != null ? <div className="ui-console-kpis">{kpis}</div> : null}
        {clock != null ? <span className="ui-console-clock">{clock}</span> : null}
        {fullscreen && canFull && !phone ? (
          <IconButton label={full ? tr('離開全螢幕') : tr('全螢幕')} icon={full ? 'corners-in' : 'corners-out'} onClick={toggleFull} />
        ) : null}
      </div>
    </header>
  );

  return (
    <div ref={ref} className={cx('ui-console', phone && 'is-stacked', className)}>
      <div className="ui-console-frame" style={frameStyle}>
        {top}
        <main className="ui-console-main">{main}</main>
        {phone ? (
          <>
            {side}
            {bottom}
            {shown.map((x) => (
              <React.Fragment key={x.id}>{x.node}</React.Fragment>
            ))}
          </>
        ) : (
          <>
            <aside className="ui-console-side" aria-label={tr('側欄')}>
              {side}
              {shown.map((x) => (
                <React.Fragment key={x.id}>{x.node}</React.Fragment>
              ))}
            </aside>
            {bottom != null ? <div className="ui-console-bottom">{bottom}</div> : null}
          </>
        )}
      </div>
    </div>
  );
}
