import * as React from 'react';
import { tr } from '../i18n';
import { CHECK } from '../icons/Icon';
import { Dialog } from '../components/Dialog/Dialog';
import { IconButton } from '../components/IconButton/IconButton';
import { announce } from '../announce';
import { copyText, cx } from './util';
import { includeIcons } from '../icons/store';
import phCopy from '../icons/ph/copy';
import phCornersOut from '../icons/ph/corners-out';

includeIcons(phCopy, phCornersOut);

/* What Markdown tables and DataTable share: the column border that drags, the 「放大表格」 dialog, and the
   「複製成 Markdown」 icon. One implementation, so both tables behave and look the same. */

/** The narrowest a dragged column gets (px); a DataTable column also never gets narrower than its heading. */
export const MIN_COL = 48;
/** One ← or → on a column border (px). */
export const COL_STEP = 16;

/** The right border of a header cell, dragged to set the column's width. ← → 16 px, Enter or a double-click back
 *  to the widths by content. A click without dragging (one pointer, WCAG 2.5.7) steps the width up: 1.5 times, twice,
 *  then back to the width by content. Hidden on touch screens (CSS), where 「放大表格」 shows the whole table instead. */
export function ColResize(p: {
  /** The column's name: the border is called 「調整「名稱」欄寬」. */
  name: string;
  /** Its width now (px), for aria-valuenow. */
  width: number;
  /** The narrowest it may get (px). */
  min?: number;
  /** The width when a drag or a key starts: the set width, or the drawn one. */
  start: () => number;
  /** A new width (px), from a drag, a key or a click. */
  onWidth: (px: number) => void;
  /** Back to the width by content (Enter, a double-click, the last click step). */
  onReset: () => void;
  /** A drag starts (true) or ends (false). */
  onDragging?: (on: boolean) => void;
}) {
  const [on, setOn] = React.useState(false);
  const from = React.useRef<{ x: number; w: number; moved: boolean } | null>(null);
  // The click steps: the width they started from and the last one set, so a drag or a key in between starts over.
  const steps = React.useRef<{ base: number; n: number; last: number } | null>(null);
  const min = p.min ?? MIN_COL;
  const set = (w: number) => p.onWidth(Math.max(min, Math.round(w)));
  const drag = (v: boolean) => {
    setOn(v);
    p.onDragging?.(v);
  };
  const step = () => {
    const cur = steps.current && Math.abs(steps.current.last - p.width) <= 1 ? steps.current : { base: p.start(), n: 0, last: -1 };
    const n = cur.n + 1;
    if (n >= STEPS.length + 1) {
      steps.current = null;
      p.onReset();
      announce(tr('已還原「{name}」欄寬', { name: p.name }));
      return;
    }
    const w = Math.max(min, Math.round(cur.base * STEPS[n - 1]));
    steps.current = { base: cur.base, n, last: w };
    p.onWidth(w);
    announce(tr('「{name}」欄寬 {n} px', { name: p.name, n: w }));
  };
  return (
    <span
      className={cx('ui-col-resize', on && 'is-dragging')}
      role="separator"
      aria-orientation="vertical"
      aria-label={tr('調整「{name}」欄寬', { name: p.name })}
      aria-description={tr('拖曳或按 ← → 調整；按一下依序加寬，按 Enter 還原')}
      aria-valuenow={Math.round(p.width)}
      aria-valuemin={min}
      tabIndex={0}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        from.current = { x: e.clientX, w: p.start(), moved: false };
        drag(true);
      }}
      onPointerMove={(e) => {
        const f = from.current;
        if (!f) return;
        // A few px of jitter in a click is not a drag.
        if (!f.moved && Math.abs(e.clientX - f.x) < DRAG_MIN) return;
        f.moved = true;
        steps.current = null;
        set(f.w + e.clientX - f.x);
      }}
      onPointerUp={() => {
        const clicked = from.current && !from.current.moved;
        from.current = null;
        drag(false);
        if (clicked) step();
      }}
      onPointerCancel={() => {
        from.current = null;
        drag(false);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        steps.current = null;
        p.onReset();
      }}
      onKeyDown={(e) => {
        if (e.altKey || e.metaKey || e.ctrlKey) return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          e.stopPropagation();
          steps.current = null;
          set(p.start() + (e.key === 'ArrowRight' ? COL_STEP : -COL_STEP));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          steps.current = null;
          p.onReset();
        }
      }}
    />
  );
}

// A click on a column border: the width it started from times these, then back to the width by content.
const STEPS = [1.5, 2];
// A pointer that moves less than this (px) between down and up clicked.
const DRAG_MIN = 4;

/** The 「放大表格」 icon: 32 px, no border, at a Markdown table's top right; in a DataTable's toolbar (inToolbar) it is a
 *  toolbar button like 「複製成 Markdown」. */
export function ZoomButton({ onClick, inToolbar }: { onClick: () => void; inToolbar?: boolean }) {
  return <IconButton className={inToolbar ? 'ui-dt-zoombtn' : 'ui-table-zoom'} icon="corners-out" label={tr('放大表格')} onClick={onClick} />;
}

/** The whole table in a wide dialog (at most 1200 px). A plain click on a link inside (a function, a path) closes the
 *  dialog after the link has done its job; Ctrl, ⌘, Shift or the middle button open a new tab and keep it open. */
export function TableDialog(p: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  if (!p.open) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && p.onClose()} title={p.title || tr('表格')} className="ui-table-dialog">
      <div
        className="ui-table-dialog-body"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          const link = (e.target as Element).closest('a[href], [role="link"], .ui-code.is-link, .ui-md-link');
          if (link && e.currentTarget.contains(link)) p.onClose();
        }}
      >
        {p.children}
      </div>
    </Dialog>
  );
}

/** The 「複製成 Markdown」 icon: copies the text, turns into a check for 2 s and says 「已複製」, as CodeView's copy. */
export function CopyMarkdownButton(p: { text: () => string; onCopyError?: () => void; className?: string }) {
  const [done, setDone] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <IconButton
      className={cx('ui-table-copy', done && 'is-copied', p.className)}
      icon={done ? CHECK : 'copy'}
      label={done ? tr('已複製') : tr('複製成 Markdown')}
      onClick={() =>
        copyText(p.text()).then(
          () => {
            setDone(true);
            announce(tr('已複製'));
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setDone(false), 2000);
          },
          () => p.onCopyError?.(),
        )
      }
    />
  );
}

/** A table as GitHub Markdown: | in a cell is escaped, line breaks become spaces. */
export function markdownTable(heads: string[], rows: string[][]): string {
  const cell = (s: string) => s.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim();
  return [`| ${heads.map(cell).join(' | ')} |`, `|${heads.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n');
}
