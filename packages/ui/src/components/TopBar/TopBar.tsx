import type * as React from 'react';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { IS_MAC, SHORTCUT, TOUCH_ONLY, cx, useMedia } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { Breadcrumb, type BreadcrumbItem } from '../Breadcrumb/Breadcrumb';
import { IconButton } from '../IconButton/IconButton';
import { includeIcons } from '../../icons/store';
import phListBullets from '../../icons/ph/list-bullets';
import phMagnifyingGlass from '../../icons/ph/magnifying-glass';

includeIcons(phListBullets, phMagnifyingGlass);

export interface TopBarProps {
  /** The page title, shown once: either here or as the page's own heading. */
  title?: string;
  /** Right after the title, e.g. a Tag 「示範資料」 with the info icon: the size of the title. */
  tags?: React.ReactNode;
  /** @deprecated A breadcrumb goes at the top of the content: put `<Breadcrumb items={…} />` first in the page. */
  breadcrumb?: BreadcrumbItem[];
  /** Opens search (CommandPalette). false hides the search entry. */
  onSearch?: (() => void) | false;
  /** Default 「搜尋」. */
  searchLabel?: string;
  /** Right side: NotificationBell, ProjectSwitcher, the account menu. */
  children?: React.ReactNode;
  /** A menu button at the left that opens the navigation (AppShell from 600 to 959 px). */
  onMenu?: () => void;
  /** Extra class on the root element. */
  className?: string;
}

/** The bar at the top of a dashboard page: title or breadcrumb on the left, search and tools on the right. */
export function TopBar({ title, tags, breadcrumb, onSearch, searchLabel, children, onMenu, className }: TopBarProps) {
  const touch = useMedia(TOUCH_ONLY);
  devWarn(
    breadcrumb,
    'TopBar',
    '`breadcrumb` is deprecated: a breadcrumb in the top bar repeats the page title. Put <Breadcrumb items={…} /> first in the page content instead.',
  );
  return (
    <header className={cx('ui-topbar', className)}>
      {onMenu ? <IconButton className="ui-topbar-menu" icon="list-bullets" label={tr('開啟導覽')} onClick={onMenu} /> : null}
      {title ? <h1 className="ui-topbar-title">{title}</h1> : null}
      {tags ? <div className="ui-topbar-tags">{tags}</div> : null}
      {breadcrumb ? <Breadcrumb items={breadcrumb} /> : null}
      <div className="ui-topbar-end">
        {onSearch !== false ? (
          <>
            <button type="button" className="ui-search" data-tour="search" onClick={onSearch} aria-keyshortcuts={IS_MAC ? 'Meta+K' : 'Control+K'}>
              <Icon name="magnifying-glass" size={16} />
              <span>{searchLabel || tr('搜尋')}</span>
              {/* No keyboard on a touch screen: no shortcut to show. */}
              {touch ? null : <kbd>{SHORTCUT}</kbd>}
            </button>
            <IconButton
              className="ui-search-icon"
              data-tour="search"
              icon="magnifying-glass"
              label={touch ? tr('搜尋') : tr('搜尋（{k}）', { k: SHORTCUT })}
              onClick={onSearch}
            />
          </>
        ) : null}
        {children}
      </div>
    </header>
  );
}
