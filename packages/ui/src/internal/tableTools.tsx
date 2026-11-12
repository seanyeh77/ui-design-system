import * as React from 'react';
import { tr } from '../i18n';
import { CHECK } from '../icons/Icon';
import { Dialog } from '../components/Dialog/Dialog';
import { IconButton } from '../components/IconButton/IconButton';
import { announce } from '../announce';
import { copyText, cx } from './util';

/* What Markdown tables and DataTable share: the column border that drags, the 「放大表格」 dialog, and the
   「複製成 Markdown」 icon. One implementation, so both tables behave and look the same. */

/** The narrowest a dragged column gets (px); a DataTable column also never gets narrower than its heading. */
export const MIN_COL = 48;
/** One ← or → on a column border (px). */
export const COL_STEP = 16;

/** The right border of a header cell, dragged to set the column's width. ← → 16 px, Enter or a double-click back
 *  to the widths by content. Hidden on touch screens (CSS), where 「放大表格」 shows the whole table instead. */
export function ColResize(p: {
  /** The column's name: the border is called 「調整「名稱」欄寬」. */
  name: string;
  /** Its width now (px), for aria-valuenow. */
  width: number;
  /** The narrowest it may get (px). */
  min?: number;
  /** The width when a drag or a key starts: the set width, or the drawn one. */
  start: () => number;
  onWidth: (px: number) => void;
  onReset: () => void;
  onDragging?: (on: boolean) => void;
}) {
  const [on, setOn] = React.useState(false);
  const from = React.useRef<{ x: number; w: number } | null>(null);
  const min = p.min ?? MIN_COL;
  const set = (w: number) => p.onWidth(Math.max(min, Math.round(w)));
  const drag = (v: boolean) => {
    setOn(v);
    p.onDragging?.(v);
  };
  return (
    <span
      className={cx('ui-col-resize', on && 'is-dragging')}
      role="separator"
      aria-orientation="vertical"
      aria-label={tr('調整「{name}」欄寬', { name: p.name })}
      aria-valuenow={Math.round(p.width)}
      aria-valuemin={min}
      tabIndex={0}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        from.current = { x: e.clientX, w: p.start() };
        drag(true);
      }}
      onPointerMove={(e) => {
        if (from.current) set(from.current.w + e.clientX - from.current.x);
      }}
      onPointerUp={() => {
        from.current = null;
        drag(false);
      }}
      onPointerCancel={() => {
        from.current = null;
        drag(false);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        p.onReset();
      }}
      onKeyDown={(e) => {
        if (e.altKey || e.metaKey || e.ctrlKey) return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          e.stopPropagation();
          set(p.start() + (e.key === 'ArrowRight' ? COL_STEP : -COL_STEP));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          p.onReset();
        }
      }}
    />
  );
}

/** The 「放大表格」 icon: 32 px, no border, at the table's top right. */
export function ZoomButton({ onClick }: { onClick: () => void }) {
  return <IconButton className="ui-table-zoom" icon="corners-out" label={tr('放大表格')} onClick={onClick} />;
}

/** The whole table in a wide dialog (at most 1200 px). A plain click on a link inside (a function, a path) closes the
 *  dialog after the link has done its job; Ctrl, ⌘, Shift or the middle button open a new tab and keep it open. */
export function TableDialog(p: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  if (!p.open) return null;
  return (
    <Dialog open onClose={p.onClose} title={p.title || tr('表格')} className="ui-table-dialog">
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
