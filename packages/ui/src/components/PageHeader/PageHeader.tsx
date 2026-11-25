import * as React from 'react';
import { tr } from '../../i18n';
import type { IconSource } from '../../icons/Icon';
import { cx, useNarrow } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { ShellTitle } from '../../internal/shell';
import { Button } from '../Button/Button';
import { Menu, type MenuItem } from '../Menu/Menu';

/** A button of the page header: a verb and an optional icon. */
export interface PageHeaderAction {
  /** A verb: 編輯, 匯出, 出貨. */
  label: string;
  icon?: IconSource;
  onClick?: () => void;
  disabled?: boolean;
}

export interface PageHeaderProps {
  /** The record's name, the page's one h1: 「訂單 #1024」. Leave it out when AppShell's top bar shows the title. */
  title?: React.ReactNode;
  /** First on the line under the title, the size of the facts beside it: a Badge, e.g. <Badge status="doing" />. */
  status?: React.ReactNode;
  /** Secondary facts after the status: 「建立於 2026/11/04（三）· 負責人 王小明」. */
  meta?: React.ReactNode;
  /** The page's one main action, a solid button at the right end. */
  primary?: PageHeaderAction;
  /** Other actions as outline buttons before it; on phones they go into the ⋯ menu. */
  actions?: PageHeaderAction[];
  /** Actions in the ⋯ menu at the very end, e.g. 刪除 (danger items are confirmed). */
  more?: MenuItem[];
  /** Texts: `more` is the name of the ⋯ button (default 「更多操作」). */
  labels?: { more?: string };
  /** Extra class on the root element. */
  className?: string;
}

/** The top of a detail page: the record's title (or none when the top bar has it), its status, one line of facts, and
 *  its actions: one primary, a few outline buttons, and the rest in ⋯. On phones only the primary stays a button. */
export function PageHeader({ title, status, meta, primary, actions = [], more = [], labels, className }: PageHeaderProps) {
  const shell = React.useContext(ShellTitle);
  const phone = useNarrow();
  devWarn(
    title && shell.title,
    'PageHeader',
    'the page title shows twice: AppShell has `title` and PageHeader has `title`. On a detail page, leave AppShell `title` out and give the record name to PageHeader.',
  );
  devWarn(actions.length > 3, 'PageHeader', `${actions.length} outline buttons crowd the header. Keep at most 3 in \`actions\` and put the rest in \`more\`.`);
  const folded: MenuItem[] = phone ? actions.map((a) => ({ label: a.label, icon: a.icon, onSelect: a.onClick, disabled: a.disabled })) : [];
  const menu = [...folded, ...more];
  const hasActions = !!primary || (!phone && actions.length > 0) || menu.length > 0;
  return (
    <header className={cx('ui-pagehead', className)}>
      <div className="ui-pagehead-main">
        {title ? <h1 className="ui-pagehead-title">{title}</h1> : null}
        {status || meta ? (
          <div className="ui-pagehead-meta">
            {status ? <span className="ui-pagehead-status">{status}</span> : null}
            {meta ? <span className="ui-pagehead-facts">{meta}</span> : null}
          </div>
        ) : null}
      </div>
      {hasActions ? (
        <div className="ui-pagehead-actions">
          {phone
            ? null
            : actions.map((a) => (
                <Button key={a.label} icon={a.icon} onClick={a.onClick} disabled={a.disabled}>
                  {a.label}
                </Button>
              ))}
          {primary ? (
            <Button variant="primary" icon={primary.icon} onClick={primary.onClick} disabled={primary.disabled}>
              {primary.label}
            </Button>
          ) : null}
          {menu.length ? <Menu items={menu} label={labels?.more || tr('更多操作')} /> : null}
        </div>
      ) : null}
    </header>
  );
}
