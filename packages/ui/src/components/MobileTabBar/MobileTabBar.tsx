import * as React from 'react';
import { tr } from '../../i18n';
import { IconOf, type IconSource } from '../../icons/Icon';
import { dropTransition } from '../../motion';
import { cx } from '../../internal/util';

export interface MobileTab {
  id: string;
  label: string;
  icon: IconSource;
}

export interface MobileTabBarProps {
  /** 3 to 5 top-level pages. */
  items: MobileTab[];
  value: string;
  onChange?: (id: string) => void;
  /** Default 「主要導覽」. */
  label?: string;
  /** Default true: an 11 px label under each icon (MA). false: icons only, each named by its aria-label, as in
   *  photo apps, for a bar whose icons people already know. */
  labels?: boolean;
  className?: string;
}

/** Bottom navigation on phones, in place of the sidebar. The pill slides like a droplet; the selected icon is filled. */
export function MobileTabBar({ items, value, onChange, label, labels = true, className }: MobileTabBarProps) {
  const idx = Math.max(
    0,
    items.findIndex((t) => t.id === value),
  );
  const [forward, setForward] = React.useState(true);
  const w = 100 / Math.max(1, items.length);
  return (
    <nav className={cx('ui-tabbar', labels && 'has-labels', className)} aria-label={label || tr('主要導覽')}>
      <span
        className="ui-tabbar-pill"
        aria-hidden="true"
        style={{
          left: `calc(${idx * w + w / 2}% - 28px)`,
          right: `calc(${100 - idx * w - w / 2}% - 28px)`,
          transition: dropTransition('left', 'right', forward),
        }}
      />
      {items.map((t, i) => (
        <button
          key={t.id}
          type="button"
          className={cx('ui-tabbar-item', i === idx && 'is-selected')}
          // With labels the text names the button; without, aria-label does.
          aria-label={labels ? undefined : t.label}
          aria-current={i === idx ? 'page' : undefined}
          onClick={() => {
            // The selected tab still reports a press: a tab like 「更多」 opens something each time.
            if (i !== idx) setForward(i > idx);
            onChange?.(t.id);
          }}
        >
          <IconOf icon={t.icon} size={22} filled={i === idx} />
          {labels ? <span className="ui-tabbar-label">{t.label}</span> : null}
        </button>
      ))}
    </nav>
  );
}
