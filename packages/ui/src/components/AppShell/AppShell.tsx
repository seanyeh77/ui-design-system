import * as React from 'react';
import { SideNav, type NavItem, type NavSection } from '../SideNav/SideNav';
import { TopBar } from '../TopBar/TopBar';
import { MobileTabBar, type MobileTab } from '../MobileTabBar/MobileTabBar';
import { Drawer } from '../Drawer/Drawer';
import { tr } from '../../i18n';
import type { BreadcrumbItem } from '../Breadcrumb/Breadcrumb';
import { cx, store, useMedia, useNarrow } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { ensureAnnouncer } from '../../announce';
import { focusMain } from '../../internal/focusMain';

export interface AppShellProps {
  /** Sidebar groups. On phones, top-level items with an icon become bottom tabs; pages they cannot reach go under 「更多」. */
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

export { focusMain };
const MORE = '\u0000more';

/** The dashboard frame: sidebar (240 px, 72 px collapsed and on tablets), top bar, and bottom tabs on phones.
 *  The top bar hides while scrolling down and returns when scrolling up. */
export function AppShell({ nav, value, onNavigate, brand, title, breadcrumb, onSearch, actions, children, className }: AppShellProps) {
  const phone = useNarrow();
  const tablet = useMedia('(min-width: 600px) and (max-width: 959px)');
  const [userCollapsed, setUserCollapsed] = React.useState(() => store(COLLAPSE_KEY) === '1');
  const collapsed = tablet || userCollapsed;
  const top = nav.flatMap((s) => s.items);
  const parentOf = (id: string) => top.find((it) => it.children?.some((c) => c.id === id));
  // Phones: top-level items with an icon become tabs (a group opens its first page).
  // When some page is not reachable that way, the last tab becomes 「更多」 and opens the whole nav.
  const withIcon = top.filter((it): it is NavItem & { icon: NonNullable<NavItem['icon']> } => !!it.icon);
  const unreachable = top.some((it) => !it.icon || (it.children?.length ?? 0) > 1) || withIcon.length > 5;
  const tabs: MobileTab[] = withIcon.slice(0, unreachable ? 4 : 5).map((it) => ({ id: it.id, label: it.label, icon: it.icon }));
  if (unreachable) tabs.push({ id: MORE, label: tr('更多'), icon: 'dots-three' });
  const [moreOpen, setMoreOpen] = React.useState(false);
  devWarn(phone && withIcon.length < 2, 'AppShell', 'phones show the top-level nav items as bottom tabs; give at least 2 of them an icon.');
  const current = parentOf(value)?.id ?? value;
  const tabValue = tabs.some((t) => t.id === current) ? current : MORE;
  const onTab = (id: string) => {
    if (id === MORE) return setMoreOpen(true);
    if (id === current) return;
    const item = top.find((it) => it.id === id);
    onNavigate(item?.children?.[0]?.id ?? id);
  };

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

  React.useEffect(() => {
    ensureAnnouncer();
  }, []);
  return (
    <div className={cx('ui-shell', phone && 'is-phone', className)}>
      {/* First stop for the keyboard: skips the navigation. */}
      <a
        className="ui-skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          focusMain();
        }}
      >
        {tr('跳到主要內容')}
      </a>
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
        <main ref={main} className="ui-shell-main" tabIndex={-1}>
          {children}
        </main>
        {phone && tabs.length ? <MobileTabBar items={tabs} value={tabValue} onChange={onTab} /> : null}
        {phone ? (
          <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title={tr('全部頁面')}>
            <SideNav
              className="ui-shell-allnav"
              sections={nav}
              value={value}
              onChange={(id) => {
                setMoreOpen(false);
                onNavigate(id);
              }}
            />
          </Drawer>
        ) : null}
      </div>
    </div>
  );
}
