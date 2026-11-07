import * as React from 'react';
import { tr } from '../../i18n';
import { Icon, IconOf, type IconSource } from '../../icons/Icon';
import { dropTransition, useMoving } from '../../motion';
import { cx } from '../../internal/util';

export interface NavItem {
  id: string;
  label: string;
  /** Top-level items have an icon; the selected one is filled. */
  icon?: IconSource;
  /** Second level, shown under the item; it opens and closes. */
  children?: NavItem[];
}

export interface NavSection {
  items: NavItem[];
}

export interface SideNavProps {
  /** Groups separated by a divider. */
  sections: NavSection[];
  /** Id of the current page. */
  value: string;
  onChange?: (id: string) => void;
  /** 72 px with icons only, labels as tooltips. */
  collapsed?: boolean;
  /** Adds the collapse button at the bottom left. */
  onToggle?: () => void;
  brand?: React.ReactNode;
  /** Default 「主要導覽」. */
  label?: string;
  className?: string;
}

/** The 240 px dashboard sidebar (72 px collapsed). The selection bar moves like a droplet. */
export function SideNav({ sections, value, onChange, collapsed = false, onToggle, brand, label, className }: SideNavProps) {
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const wrap = React.useRef<HTMLDivElement>(null);
  const [bar, setBar] = React.useState({ top: 0, bottom: 0, show: false, down: true });
  const last = React.useRef<{ top: number; bottom: number } | null>(null);
  const [moving, bump] = useMoving();
  const [closed, setClosed] = React.useState<Record<string, boolean>>({});
  const closedKey = Object.keys(closed)
    .filter((k) => closed[k])
    .join();
  React.useLayoutEffect(() => {
    let el = refs.current[value];
    if (!el) {
      const parent = sections.flatMap((s) => s.items).find((it) => it.children?.some((c) => c.id === value));
      el = parent ? refs.current[parent.id] : null;
    }
    const box = wrap.current;
    if (!el || !box) return;
    const y = el.getBoundingClientRect().top - box.getBoundingClientRect().top;
    const top = Math.round(y) + 8;
    const bottom = Math.round(box.clientHeight - y - el.offsetHeight) + 8;
    const prev = last.current;
    if (prev && prev.top === top && prev.bottom === bottom) return;
    if (prev && prev.top !== top) bump();
    last.current = { top, bottom };
    setBar({ top, bottom, show: true, down: !prev || top >= prev.top });
  }, [value, collapsed, closedKey, sections, bump]);

  const row = (it: NavItem, sub: boolean): React.ReactNode[] => {
    const kids = it.children ?? [];
    const hasKids = kids.length > 0 && !collapsed;
    const isOpen = !closed[it.id];
    const selected = value === it.id || ((!hasKids || !isOpen) && kids.some((c) => c.id === value));
    const out: React.ReactNode[] = [
      <div key={it.id} className="ui-nav-row">
        <button
          type="button"
          ref={(n) => {
            refs.current[it.id] = n;
          }}
          className={cx('ui-nav-item', sub && 'is-sub', selected && 'is-selected')}
          aria-current={selected ? 'page' : undefined}
          aria-expanded={hasKids ? isOpen : undefined}
          aria-label={collapsed ? it.label : undefined}
          // Collapsed, a parent opens its first page; the page switches between its siblings itself.
          onClick={() => (hasKids ? setClosed({ ...closed, [it.id]: isOpen }) : onChange?.(kids[0]?.id ?? it.id))}
        >
          {it.icon && !sub ? <IconOf icon={it.icon} size={22} filled={selected} className="ui-nav-icon" /> : null}
          {collapsed ? null : <span className="ui-nav-label">{it.label}</span>}
          {hasKids ? <Icon name="caret-right" size={16} className={cx('ui-nav-chev', isOpen && 'is-open')} /> : null}
        </button>
        {collapsed ? (
          <span className="ui-nav-tip" role="tooltip">
            {it.label}
          </span>
        ) : null}
      </div>,
    ];
    if (hasKids && isOpen) for (const c of kids) out.push(...row(c, true));
    return out;
  };

  const toggleLabel = collapsed ? tr('展開側邊欄') : tr('收合側邊欄');
  return (
    <aside className={cx('ui-sidenav', collapsed && 'is-collapsed', className)}>
      {brand ? <div className="ui-nav-brand">{brand}</div> : null}
      <nav className="ui-nav-list" aria-label={label || tr('主要導覽')}>
        <div ref={wrap} className="ui-nav-inner">
          {bar.show ? (
            <span
              className="ui-nav-bar"
              aria-hidden="true"
              style={{ top: bar.top, bottom: bar.bottom, transform: moving ? 'scaleX(.7)' : 'none', transition: dropTransition('top', 'bottom', bar.down) }}
            />
          ) : null}
          {sections.map((sec, i) => (
            <React.Fragment key={i}>
              {i > 0 ? <div className="ui-nav-divider" role="separator" /> : null}
              {sec.items.flatMap((it) => row(it, false))}
            </React.Fragment>
          ))}
        </div>
      </nav>
      {onToggle ? (
        <button type="button" className="ui-nav-collapse" aria-label={toggleLabel} title={toggleLabel} onClick={onToggle}>
          <Icon name="sidebar-simple" size={20} />
        </button>
      ) : null}
    </aside>
  );
}
