import * as React from 'react';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { FloatingPanel } from '../../internal/FloatingPanel';

export interface NotificationItem {
  id: string | number;
  title: string;
  body?: string;
  /** Relative within a week: format.relative(date). */
  time?: string;
  /** Group heading, e.g. 今天, 更早. Items must already be newest first. */
  group?: string;
  read?: boolean;
}

export interface NotificationBellProps {
  items: NotificationItem[];
  onOpen?: (item: NotificationItem) => void;
  onReadAll?: () => void;
  /** Default 「沒有通知」. */
  emptyText?: string;
}

/** The bell in the top bar: a red count (99+ above 99) and a 360 px panel of notifications grouped by time. */
export function NotificationBell({ items, onOpen, onReadAll, emptyText }: NotificationBellProps) {
  const [open, setOpen] = React.useState(false);
  const unread = items.filter((it) => !it.read).length;
  const groups: { title: string; items: NotificationItem[] }[] = [];
  for (const it of items) {
    const g = it.group || '';
    const last = groups[groups.length - 1];
    if (!last || last.title !== g) groups.push({ title: g, items: [it] });
    else last.items.push(it);
  }
  return (
    <FloatingPanel
      open={open}
      onOpenChange={setOpen}
      align="end"
      sideOffset={8}
      className="ui-noti"
      aria-label={tr('通知')}
      trigger={
        <button
          type="button"
          className={cx('ui-iconbtn', 'ui-bell', open && 'is-open')}
          aria-label={unread ? tr('通知，{n} 則未讀', { n: unread }) : tr('通知')}
        >
          <Icon name="bell" />
          {unread ? (
            <span className="ui-badge-count" aria-hidden="true">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </button>
      }
    >
      <div className="ui-noti-head">
        <div className="ui-noti-title">{tr('通知')}</div>
        {unread && onReadAll ? (
          <button type="button" className="ui-noti-readall" onClick={onReadAll}>
            {tr('全部標為已讀')}
          </button>
        ) : null}
      </div>
      <div className="ui-noti-list">
        {items.length ? (
          groups.map((g, gi) => (
            <React.Fragment key={gi}>
              {g.title ? <div className="ui-noti-group">{g.title}</div> : null}
              {g.items.map((it) => (
                <button key={it.id} type="button" className={cx('ui-noti-item', !it.read && 'is-unread')} onClick={() => onOpen?.(it)}>
                  {/* A span's aria-label is not read: the state is hidden text instead, read first, 「未讀，標題」. */}
                  {!it.read ? (
                    <>
                      <span className="ui-noti-dot" aria-hidden="true" />
                      <span className="ui-visually-hidden">{tr('未讀') + tr('，')}</span>
                    </>
                  ) : null}
                  <span className="ui-noti-text">
                    <span className="ui-noti-t">{it.title}</span>
                    {it.body ? <span className="ui-noti-b">{it.body}</span> : null}
                    {it.time ? <span className="ui-noti-time">{it.time}</span> : null}
                  </span>
                </button>
              ))}
            </React.Fragment>
          ))
        ) : (
          <div className="ui-noti-empty">{emptyText || tr('沒有通知')}</div>
        )}
      </div>
    </FloatingPanel>
  );
}
