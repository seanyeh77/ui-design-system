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
  /** Labels under the phone tab bar's icons (MobileTabBar labels). Default true. */
  tabLabels?: boolean;
  /** Desktop: whether the sidebar starts pinned (240 px, or 72 px collapsed, beside the content) until the reader
   *  pins or unpins it; their choice is kept in the browser. Default false: a 72 px strip of icons that opens to
   *  240 px over the content while the pointer or the keyboard focus is on it. */
  defaultPinned?: boolean;
  className?: string;
}

const COLLAPSE_KEY = 'ui-nav-collapsed';
const PIN_KEY = 'ui-nav-pinned';
/** Pointer on the strip this long before it opens (passing over it on the way to the browser's edge does not). */
const OPEN_DELAY = 100;
/** Pointer away this long before it hides again (a slip off the edge does not). */
const CLOSE_DELAY = 300;

export { focusMain };
const MORE = '\u0000more';

/** The dashboard frame: sidebar (240 px, 72 px collapsed) above 1024 px, a drawer from the top bar's menu button from
 *  600 to 1024 px, and bottom tabs on phones.
 *  The top bar hides while scrolling down and returns when scrolling up. */
export function AppShell({
  nav,
  value,
  onNavigate,
  brand,
  title,
  breadcrumb,
  onSearch,
  actions,
  children,
  tabLabels,
  defaultPinned = false,
  className,
}: AppShellProps) {
  const phone = useNarrow();
  // 600 to 1024 px (tablets, narrow windows): no sidebar; the top bar's menu button opens the whole nav in a drawer.
  const tablet = useMedia('(min-width: 600px) and (max-width: 1024px)');
  const [userCollapsed, setUserCollapsed] = React.useState(() => store(COLLAPSE_KEY) === '1');
  // Pinned: the sidebar sits beside the content as before (240 px, or 72 px collapsed). Not pinned: a 72 px strip of
  // icons that opens over the content. Someone who already chose collapsed or expanded keeps a pinned sidebar.
  const [pinned, setPinned] = React.useState(() => {
    const v = store(PIN_KEY);
    if (v != null) return v === '1';
    return store(COLLAPSE_KEY) != null || defaultPinned;
  });
  const [open, setOpen] = React.useState(false);
  const openTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const later = (show: boolean) => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    if (show) openTimer.current = setTimeout(() => setOpen(true), OPEN_DELAY);
    else closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  };
  React.useEffect(
    () => () => {
      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);
    },
    [],
  );
  const collapsed = pinned ? userCollapsed : !open;
  const togglePin = () => {
    store(PIN_KEY, pinned ? '0' : '1');
    setPinned(!pinned);
    setOpen(false);
  };
  const top = nav.flatMap((s) => s.items);
  const parentOf = (id: string) => top.find((it) => it.children?.some((c) => c.id === id));
  // Phones: top-level items with an icon become tabs (a group opens its first page).
  // When some page is not reachable that way, the last tab becomes 「更多」 and opens the whole nav.
  const withIcon = top.filter((it): it is NavItem & { icon: NonNullable<NavItem['icon']> } => !!it.icon);
  const unreachable = top.some((it) => !it.icon || (it.children?.length ?? 0) > 1) || withIcon.length > 5;
  const tabs: MobileTab[] = withIcon.slice(0, unreachable ? 4 : 5).map((it) => ({ id: it.id, label: it.label, icon: it.icon }));
  if (unreachable) tabs.push({ id: MORE, label: tr('更多'), icon: 'dots-three' });
  const [moreOpen, setMoreOpen] = React.useState(false);
  // Widened past the drawer's layouts (to a desktop with the sidebar): closed, so it does not pop up again when the
  // window narrows later.
  if (moreOpen && !phone && !tablet) setMoreOpen(false);
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
      {phone || tablet ? null : pinned ? (
        <SideNav
          sections={nav}
          value={value}
          onChange={onNavigate}
          brand={brand}
          collapsed={collapsed}
          pinned
          onPin={togglePin}
          onToggle={() => {
            store(COLLAPSE_KEY, userCollapsed ? '0' : '1');
            setUserCollapsed(!userCollapsed);
          }}
        />
      ) : (
        // Not pinned: the strip keeps its 72 px in the layout; the sidebar inside opens over the content and closes
        // again when the pointer and the focus have left it, after a page is chosen, or on Esc.
        <div
          className={cx('ui-shell-rail', open && 'is-open')}
          onPointerEnter={(e) => e.pointerType === 'mouse' && later(true)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && later(false)}
          onFocus={(e) => {
            if (!(e.target as Element).matches(':focus-visible')) return;
            clearTimeout(closeTimer.current);
            setOpen(true);
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && open) {
              e.stopPropagation();
              setOpen(false);
            }
          }}
        >
          <SideNav
            sections={nav}
            value={value}
            onChange={(id) => {
              clearTimeout(openTimer.current);
              setOpen(false);
              onNavigate(id);
            }}
            brand={brand}
            collapsed={collapsed}
            onPin={togglePin}
          />
        </div>
      )}
      <div className="ui-shell-body">
        <TopBar
          className={cx('ui-shell-top', hidden && 'is-hidden')}
          title={title}
          breadcrumb={breadcrumb}
          onSearch={onSearch ?? false}
          onMenu={tablet ? () => setMoreOpen(true) : undefined}
        >
          {actions}
        </TopBar>
        <main ref={main} className="ui-shell-main" tabIndex={-1}>
          {children}
        </main>
        {phone && tabs.length ? <MobileTabBar items={tabs} value={tabValue} onChange={onTab} labels={tabLabels} /> : null}
        {phone || tablet ? (
          <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title={tr('全部頁面')} side={tablet ? 'left' : 'right'} width={tablet ? 300 : undefined}>
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
