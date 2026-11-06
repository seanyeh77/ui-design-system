import { tr } from '../../i18n';
import { cx } from '../../internal/util';
import { Button, type DangerConfirm } from '../Button/Button';

export interface DangerZoneProps {
  /** Default 「危險操作」. */
  title?: string;
  /** What the action destroys. */
  description: string;
  /** Default 「刪除」. */
  actionLabel?: string;
  /** Runs after the person confirms. */
  onAction: () => void;
  /** The confirm dialog: name the object in the title. */
  confirm: DangerConfirm;
  className?: string;
}

/** A red-bordered block at the bottom of a settings page for delete-type actions; the button asks to confirm. */
export function DangerZone({ title, description, actionLabel, onAction, confirm, className }: DangerZoneProps) {
  return (
    <section className={cx('ui-danger', className)}>
      <h2 className="ui-danger-title">{title || tr('危險操作')}</h2>
      <div className="ui-danger-row">
        <p>{description}</p>
        <Button variant="danger" confirm={confirm} onClick={onAction}>
          {actionLabel || tr('刪除')}
        </Button>
      </div>
    </section>
  );
}
