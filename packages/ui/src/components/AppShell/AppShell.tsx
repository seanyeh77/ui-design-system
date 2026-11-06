import * as React from 'react';
import { SideNav, type NavItem, type NavSection } from '../SideNav/SideNav';
import { TopBar } from '../TopBar/TopBar';
import { MobileTabBar } from '../MobileTabBar/MobileTabBar';
import type { BreadcrumbItem } from '../Breadcrumb/Breadcrumb';
import { cx, store, useMedia } from '../../internal/util';
import { devWarn } from '../../internal/dev';

export interface AppShellProps {
  /** Sidebar groups. Top-level items with an icon also become the phone's bottom tabs (the first 5). */
  nav: NavSection[];
  /** Id of the current page. */
  value: string;
  onNavigate: (id: string) => void;
  /** Logo or product name at the top of the sidebar. */
  brand?: React.ReactNode;
  /** The page title, shown once in the top bar. Do not repeat it as a heading in the page. */
  title?: string;
  breadcrumb?: BreadcrumbItem[];
  /** Opens search (CommandPalette). */
  onSearch?: () => void;
  /** Right side of the top bar: NotificationBell, ProjectSwitcher, the account menu. */
  actions?: React.ReactNode;
  /** The page: Cards and sections, 32 px apart. */
  children: React.ReactNode;
  className?: string;
}

const COLLAPSE_KEY = 'ui-nav-collapsed';

/** The dashboard frame: sidebar (240 px, 72 px collapsed and on tablets), top bar, and bottom tabs on phones.
 *  The top bar hides while scrolling down and returns when scrolling up. */
export function AppShell({ nav, value, onNavigate, brand, title, breadcrumb, onSearch, actions, children, className }: AppShellProps) {
  const phone = useMedia('(max-width: 599px)');
  const tablet = useMedia('(min-width: 600px) and (max-width: 959px)');
  const [userCollapsed, setUserCollapsed] = React.useState(() => store(COLLAPSE_KEY) === '1');
  const collapsed = tablet || userCollapsed;
  const tabs = nav
    .flatMap((s) => s.items)
    .filter((it): it is NavItem & { icon: NonNullable<NavItem['icon']> } => !!it.icon)
    .slice(0, 5)
    .map((it) => ({ id: it.id, label: it.label, icon: it.icon }));
  devWarn(phone && tabs.length < 2, 'AppShell', 'phones show the top-level nav items as bottom tabs; give at least 2 of them an icon.');
  const tabValue = tabs.some((t) => t.id === value) ? value : (nav.flatMap((s) => s.items).find((it) => it.children?.some((c) => c.id === value))?.id ?? value);

  // Hide the top bar while scrolling down, show it again on the way up.
  const main = React.useRef<HTMLElement>(null);
  const [hidden, setHidden] = React.useState(false);
  React.useEffect(() => {
    const el = main.current;
    if (!el) return;
    let last = el.scrollTop;
    const onScroll = () => {
      const y = el.scrollTop;
      if (Math.abs(y - last) < 8) return;
      setHidden(y > last && y > 64);
      last = y;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={cx('ui-shell', phone && 'is-phone', className)}>
      {phone ? null : (
        <SideNav
          sections={nav}
          value={value}
          onChange={onNavigate}
          brand={brand}
          collapsed={collapsed}
          onToggle={
            tablet
              ? undefined
              : () => {
                  store(COLLAPSE_KEY, userCollapsed ? '0' : '1');
                  setUserCollapsed(!userCollapsed);
                }
          }
        />
      )}
      <div className="ui-shell-body">
        <TopBar className={cx('ui-shell-top', hidden && 'is-hidden')} title={title} breadcrumb={breadcrumb} onSearch={onSearch ?? false}>
          {actions}
        </TopBar>
        <main ref={main} className="ui-shell-main">
          {children}
        </main>
        {phone && tabs.length ? <MobileTabBar items={tabs} value={tabValue} onChange={onNavigate} /> : null}
      </div>
    </div>
  );
}
