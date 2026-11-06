import * as React from 'react';
import { Menu as Base } from '@base-ui/react/menu';
import { tr } from '../../i18n';
import { IconOf, type IconSource } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { Dialog } from '../Dialog/Dialog';
import type { DangerConfirm } from '../Button/Button';

interface MenuItemBase {
  /** A verb: 重新命名, 複製連結. */
  label: string;
  icon?: IconSource;
  /** Shown at the right, e.g. ⌘D. */
  shortcut?: string;
  disabled?: boolean;
  onSelect?: () => void;
}

export type MenuItem =
  | (MenuItemBase & { danger?: false })
  | (MenuItemBase & {
      /** Red, last, after a divider. Must be confirmed: onSelect runs after the dialog. */
      danger: true;
      confirm: DangerConfirm;
    });

export interface MenuProps {
  items: MenuItem[];
  /** aria-label and tooltip of the ⋯ button. Default 「更多操作」. */
  label?: string;
  /** Default 'dots-three'. */
  icon?: IconSource;
  /** 'end' lines up right edges (default); flips when the menu would leave the window. */
  align?: 'end' | 'start';
  /** Extra class on the ⋯ button. */
  triggerClassName?: string;
}

/** The ⋯ button and its list of actions. Danger items go last, in red, after a divider, and are confirmed. */
export function Menu({ items, label, icon = 'dots-three', align = 'end', triggerClassName }: MenuProps) {
  const [asking, setAsking] = React.useState<Extract<MenuItem, { danger: true }> | null>(null);
  const normal = items.filter((it) => !it.danger);
  const danger = items.filter((it): it is Extract<MenuItem, { danger: true }> => !!it.danger);
  const row = (it: MenuItem) => (
    <>
      {it.icon ? <IconOf icon={it.icon} size={16} /> : <span className="ui-menu-noicon" />}
      <span className="ui-menu-label">{it.label}</span>
      {it.shortcut ? <kbd className="ui-menu-kbd">{it.shortcut}</kbd> : null}
    </>
  );
  return (
    <>
      <Base.Root>
        <Base.Trigger className={cx('ui-iconbtn', 'ui-menu-trigger', triggerClassName)} aria-label={label || tr('更多操作')}>
          <IconOf icon={icon} size={20} />
        </Base.Trigger>
        <Base.Portal>
          <Base.Positioner className="ui-float" side="bottom" align={align} sideOffset={4}>
            <Base.Popup className="ui-menu">
              {normal.map((it, i) => (
                <Base.Item key={i} disabled={it.disabled} className="ui-menu-item" onClick={() => it.onSelect?.()}>
                  {row(it)}
                </Base.Item>
              ))}
              {danger.length && normal.length ? <Base.Separator className="ui-menu-sep" /> : null}
              {danger.map((it, i) => (
                <Base.Item key={'d' + i} disabled={it.disabled} className="ui-menu-item is-danger" onClick={() => setAsking(it)}>
                  {row(it)}
                </Base.Item>
              ))}
            </Base.Popup>
          </Base.Positioner>
        </Base.Portal>
      </Base.Root>
      {danger.length ? (
        <Dialog
          open={!!asking}
          onClose={() => setAsking(null)}
          title={asking ? (asking.confirm?.title ?? asking.label + '？') : ''}
          tone="danger"
          confirmLabel={asking?.confirm?.confirmLabel ?? asking?.label ?? ''}
          onConfirm={() => {
            const it = asking;
            setAsking(null);
            it?.onSelect?.();
          }}
        >
          {asking?.confirm?.body}
        </Dialog>
      ) : null}
    </>
  );
}
