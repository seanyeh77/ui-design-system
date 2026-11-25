import * as React from 'react';
import { tr } from '../../i18n';
import { Icon, IconOf, type IconSource } from '../../icons/Icon';
import { dropTransition, useMoving } from '../../motion';
import { announce } from '../../announce';
import { cx } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { Tooltip } from '../Tooltip/Tooltip';
import { includeIcons } from '../../icons/store';
import phCaretRight from '../../icons/ph/caret-right';
import phPushPin from '../../icons/ph/push-pin';
import phSidebarSimple from '../../icons/ph/sidebar-simple';

includeIcons(phCaretRight, phPushPin, phSidebarSimple);

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

/** The product at the top of the sidebar. */
export interface NavBrand {
  /** Logo or colour block, at most 24 px: stays where it is, collapsed and open. Default: the first character of
   *  `name` in an accent square. */
  mark?: React.ReactNode;
  /** The product name: shown beside the mark when the sidebar is open, the link's name when collapsed. */
  name: string;
  /** Usually the home page. */
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

const isBrand = (b: unknown): b is NavBrand =>
  !!b && typeof b === 'object' && !React.isValidElement(b) && !Array.isArray(b) && typeof (b as NavBrand).name === 'string';

function NavBrandRow({ brand, collapsed }: { brand: React.ReactNode | NavBrand; collapsed: boolean }) {
  const spec: NavBrand | null = isBrand(brand) ? brand : typeof brand === 'string' ? { name: brand } : null;
  devWarn(
    !spec && collapsed,
    'SideNav',
    'brand is an element, so the collapsed sidebar cannot tell which part is the logo and hides all of it. Pass brand={{ mark, name, href }}: collapsed shows mark, expanded adds the name.',
  );
  if (!spec) return <div className="ui-nav-brand">{collapsed ? null : (brand as React.ReactNode)}</div>;
  const inner = (
    <>
      <span className="ui-nav-mark" aria-hidden="true">
        {spec.mark ?? <span className="ui-nav-monogram">{Array.from(spec.name)[0]}</span>}
      </span>
      <span className="ui-nav-brand-name">{spec.name}</span>
    </>
  );
  // Collapsed, the name is invisible but the link keeps it as its label.
  const label = collapsed ? spec.name : undefined;
  return (
    <div className="ui-nav-brand has-mark">
      {spec.href ? (
        <a className="ui-nav-brand-link" href={spec.href} onClick={spec.onClick} aria-label={label}>
          {inner}
        </a>
      ) : spec.onClick ? (
        <button type="button" className="ui-nav-brand-link" onClick={spec.onClick} aria-label={label}>
          {inner}
        </button>
      ) : (
        <span className="ui-nav-brand-link" aria-label={label} role={label ? 'img' : undefined}>
          {inner}
        </span>
      )}
    </div>
  );
}

export interface SideNavProps {
  /** Groups separated by a divider. */
  sections: NavSection[];
  /** Id of the current page. */
  value: string;
  /** Called with the id of the item the person picks. */
  onChange?: (id: string) => void;
  /** 72 px with icons only, labels as tooltips. */
  collapsed?: boolean;
  /** Adds the collapse button at the bottom left. */
  onToggle?: () => void;
  /** Adds the pin button at the bottom left (AppShell): pinned, the sidebar stays; not pinned, it hides to icons. */
  onPin?: () => void;
  /** Whether the sidebar is pinned: the pin button is filled and says 「取消釘選」. */
  pinned?: boolean;
  /** The product at the top. Prefer { mark, name, href }: collapsed (72 px) it shows only the mark, still a link
   *  named by `name`; open, the mark with the name fading in beside it. Text alone gets its first character in an
   *  accent square as the mark. Any other element is hidden while collapsed. */
  brand?: React.ReactNode | NavBrand;
  /** Default 「主要導覽」. */
  label?: string;
  /** Extra class on the root element. */
  className?: string;
}

/** The 240 px dashboard sidebar (72 px collapsed). The selection bar moves like a droplet. */
export function SideNav({ sections, value, onChange, collapsed = false, onToggle, onPin, pinned = false, brand, label, className }: SideNavProps) {
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const wrap = React.useRef<HTMLDivElement>(null);
  const [bar, setBar] = React.useState({ top: 0, bottom: 0, show: false, down: true });
  const last = React.useRef<{ top: number; bottom: number } | null>(null);
  const [moving, bump] = useMoving();
  // A page change is announced (not the first page): screen readers hear where they are now.
  const firstValue = React.useRef<string | undefined>(value);
  React.useEffect(() => {
    if (value === firstValue.current) return;
    firstValue.current = undefined;
    const all = sections.flatMap((sec) => sec.items.flatMap((it) => [it, ...(it.children ?? [])]));
    const it = all.find((x) => x.id === value);
    if (it) announce(it.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the page changes
  }, [value]);
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
      {brand ? <NavBrandRow brand={brand} collapsed={collapsed} /> : null}
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
      {onToggle || onPin ? (
        <div className="ui-nav-foot">
          {onPin ? (
            <Tooltip label={pinned ? tr('取消釘選') : tr('釘選側邊欄')} side="right" describe={false}>
              <button
                type="button"
                className={cx('ui-nav-collapse', 'ui-nav-pin', pinned && 'is-on')}
                aria-pressed={pinned}
                aria-label={pinned ? tr('取消釘選') : tr('釘選側邊欄')}
                onClick={onPin}
              >
                <Icon name="push-pin" size={22} filled={pinned} />
              </button>
            </Tooltip>
          ) : null}
          {onToggle ? (
            <Tooltip label={toggleLabel} side="right" describe={false}>
              <button type="button" className="ui-nav-collapse" aria-label={toggleLabel} onClick={onToggle}>
                <Icon name="sidebar-simple" size={22} />
              </button>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
