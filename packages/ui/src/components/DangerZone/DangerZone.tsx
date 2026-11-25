import { tr } from '../../i18n';
import { cx } from '../../internal/util';
import { Button, type DangerConfirm } from '../Button/Button';
import { codeText } from '../InlineCode/InlineCode';

export interface DangerZoneProps {
  /** Default 「危險操作」. */
  title?: string;
  /** What the action destroys; `backticks` are code. */
  description: string;
  /** Default 「刪除」. */
  actionLabel?: string;
  /** Runs after the person confirms. */
  onAction: () => void;
  /** The confirm dialog: name the object in the title. */
  confirm: DangerConfirm;
  /** Extra class on the root element. */
  className?: string;
}

/** The last block of a settings page for delete-type actions: a card with a red title; the button asks to confirm. */
export function DangerZone({ title, description, actionLabel, onAction, confirm, className }: DangerZoneProps) {
  const label = actionLabel || tr('刪除');
  return (
    <section className={cx('ui-danger', className)}>
      <h2 className="ui-danger-title">{title || tr('危險操作')}</h2>
      <div className="ui-danger-row">
        <p>{codeText(description)}</p>
        {/* Without a build step nothing enforces confirm: ask anyway. */}
        <Button variant="danger" confirm={confirm ?? { title: tr('{label}？', { label }) }} onClick={onAction}>
          {label}
        </Button>
      </div>
    </section>
  );
}
