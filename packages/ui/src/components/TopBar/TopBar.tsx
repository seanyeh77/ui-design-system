import type * as React from 'react';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { IS_MAC, SHORTCUT, cx } from '../../internal/util';
import { Breadcrumb, type BreadcrumbItem } from '../Breadcrumb/Breadcrumb';
import { IconButton } from '../IconButton/IconButton';

export interface TopBarProps {
  /** The page title, shown once: either here or as the page's own heading. */
  title?: string;
  breadcrumb?: BreadcrumbItem[];
  /** Opens search (CommandPalette). false hides the search entry. */
  onSearch?: (() => void) | false;
  /** Default 「搜尋」. */
  searchLabel?: string;
  /** Right side: NotificationBell, ProjectSwitcher, the account menu. */
  children?: React.ReactNode;
  className?: string;
}

/** The bar at the top of a dashboard page: title or breadcrumb on the left, search and tools on the right. */
export function TopBar({ title, breadcrumb, onSearch, searchLabel, children, className }: TopBarProps) {
  return (
    <header className={cx('ui-topbar', className)}>
      {title ? <h1 className="ui-topbar-title">{title}</h1> : null}
      {breadcrumb ? <Breadcrumb items={breadcrumb} /> : null}
      <div className="ui-topbar-end">
        {onSearch !== false ? (
          <>
            <button type="button" className="ui-search" data-tour="search" onClick={onSearch} aria-keyshortcuts={IS_MAC ? 'Meta+K' : 'Control+K'}>
              <Icon name="magnifying-glass" size={16} />
              <span>{searchLabel || tr('搜尋')}</span>
              <kbd>{SHORTCUT}</kbd>
            </button>
            <IconButton className="ui-search-icon" data-tour="search" icon="magnifying-glass" label={tr('搜尋（{k}）', { k: SHORTCUT })} onClick={onSearch} />
          </>
        ) : null}
        {children}
      </div>
    </header>
  );
}
