import { tr } from '../../i18n';
import type { IconSource } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { Button, type DangerConfirm } from '../Button/Button';
import { Menu, type MenuItem } from '../Menu/Menu';

interface ActionBase {
  /** A verb. */
  label: string;
  onClick?: () => void;
  icon?: IconSource;
  disabled?: boolean;
}

export type ActionBarAction =
  | (ActionBase & {
      /** The one primary action. Default: the first action. */
      primary?: boolean;
      danger?: false;
    })
  | (ActionBase & {
      /** Red in the 「更多」 menu, confirmed first. */
      danger: true;
      confirm: DangerConfirm;
      primary?: false;
    });

export interface ActionBarProps {
  actions: ActionBarAction[];
  className?: string;
}

/** A card's actions in a row. Under 600 px the primary one fills the width and the rest go into 「更多」. */
export function ActionBar({ actions, className }: ActionBarProps) {
  const main = actions.find((a) => a.primary) ?? actions.find((a) => !a.danger);
  const others = actions.filter((a) => a !== main);
  const button = (a: ActionBarAction, i: number, wide: boolean) =>
    a.danger ? (
      <Button key={i} variant="danger" confirm={a.confirm} icon={a.icon} onClick={a.onClick} disabled={a.disabled}>
        {a.label}
      </Button>
    ) : (
      <Button key={i} variant={a === main ? 'primary' : 'secondary'} icon={a.icon} onClick={a.onClick} disabled={a.disabled} className={wide ? 'ui-actbar-main' : undefined}>
        {a.label}
      </Button>
    );
  const menuItems = others.map(
    (a): MenuItem => (a.danger ? { label: a.label, icon: a.icon, onSelect: a.onClick, disabled: a.disabled, danger: true, confirm: a.confirm } : { label: a.label, icon: a.icon, onSelect: a.onClick, disabled: a.disabled }),
  );
  return (
    <div className={cx('ui-actbar', className)}>
      <div className="ui-actbar-wide">{(main ? [main, ...others] : others).map((a, i) => button(a, i, false))}</div>
      <div className="ui-actbar-narrow">
        {main ? button(main, 0, true) : null}
        {others.length ? <Menu label={tr('更多操作')} triggerClassName="ui-actbar-more" items={menuItems} /> : null}
      </div>
    </div>
  );
}
