import * as React from 'react';
import { Link } from '../Link/Link';
import { cx } from '../../internal/util';

export interface DetailListItem {
  /** The field's name. */
  label: string;
  /** The value: text or any element (InlineCode, Tag, Badge). With `href`, plain text that names where it goes. */
  value: React.ReactNode;
  /** Makes the value a Link and the whole row a 48 px tall target that opens it. */
  href?: string;
  /** With `href`: another site, opened in a new tab (Link's `external`). */
  external?: boolean;
}

export interface DetailListProps {
  /** The rows: a label and its value each. */
  items: DetailListItem[];
  /** The label column. Default: 30 % of the width (at least 96 px). 'auto': as wide as the longest label (at most
   *  40 %), the same on every row, 24 px before the values; a number: that many px. Under 600 px labels go above. */
  labelWidth?: 'auto' | number;
  /** small (default): 13 px, muted. body: the value's size (16 px) and the ink color, for wide panels where a pale small
   *  label is hard to read. Under 600 px labels stay 13 px. */
  labelSize?: 'small' | 'body';
  /** Extra class on the root element. */
  className?: string;
}

/** Labelled facts about one item: label beside the value when there is room, above it under 600 px. A row with `href`
 *  opens its link from anywhere on the row. */
export function DetailList({ items, labelWidth, labelSize, className }: DetailListProps) {
  return (
    <dl
      className={cx('ui-dl', labelWidth === 'auto' && 'is-auto', typeof labelWidth === 'number' && 'is-fixed', labelSize === 'body' && 'is-body', className)}
      style={typeof labelWidth === 'number' ? ({ '--dl-label': labelWidth + 'px' } as React.CSSProperties) : undefined}
    >
      {items.map((it, i) =>
        it.href ? (
          <div
            key={i}
            className="ui-dl-item has-link"
            // The row is the touch target: a click outside the link opens it too (keyboard users Tab to the link).
            onClick={(e) => {
              const a = e.currentTarget.querySelector('a');
              if (a && !a.contains(e.target as Node) && !window.getSelection()?.toString()) a.click();
            }}
          >
            <dt>{it.label}</dt>
            <dd>
              <Link href={it.href} external={it.external}>
                {it.value}
              </Link>
            </dd>
          </div>
        ) : (
          <div key={i} className="ui-dl-item">
            <dt>{it.label}</dt>
            <dd>{it.value}</dd>
          </div>
        ),
      )}
    </dl>
  );
}
