import * as React from 'react';
import { IconOf, Spinner, type IconSource } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { tr } from '../../i18n';
import { Dialog } from '../Dialog/Dialog';

interface ButtonBase extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** A verb: 儲存, 刪除, 匯出. No 「確定」or 「好」. */
  children: React.ReactNode;
  /** Shows a spinner and disables the button; pair it with a progressive label such as 儲存中. */
  loading?: boolean;
  /** Leading icon: a built-in name such as 'plus', or custom path data. */
  icon?: IconSource;
  ref?: React.Ref<HTMLButtonElement>;
}

/** What the confirm dialog of a danger button says. */
export interface DangerConfirm {
  /** Names the object: 「刪除 api-gateway？」. */
  title: string;
  /** What is lost and whether it can be undone. */
  body?: React.ReactNode;
  /** The danger button's label in the dialog. Default: the button's own label. */
  confirmLabel?: string;
}

export type ButtonProps =
  | (ButtonBase & {
      /** primary: the one main action of a section. secondary (default): everything else. */
      variant?: 'primary' | 'secondary';
    })
  | (ButtonBase & {
      /** Destructive. Must be confirmed: pass `confirm`, or `confirmed` when this button is itself inside the confirm Dialog. */
      variant: 'danger';
      /** Opens a Dialog first; onClick runs only after the person confirms. */
      confirm: DangerConfirm;
      confirmed?: never;
    })
  | (ButtonBase & {
      variant: 'danger';
      /** This button is the confirming button of a Dialog (or DangerZone), so it runs at once. */
      confirmed: true;
      confirm?: never;
    });

/** Buttons. Labels are verbs; one primary per section; danger actions are always confirmed. */
export function Button(props: ButtonProps) {
  const { variant = 'secondary', loading, icon, className, children, disabled, onClick, ...other } = props;
  const { confirm, confirmed, ...native } = other as typeof other & { confirm?: DangerConfirm; confirmed?: boolean };
  const [asking, setAsking] = React.useState(false);
  devWarn(
    variant === 'danger' && !confirm && !confirmed,
    'Button',
    'a danger button needs confirm={{ title }} (or confirmed when it is the button inside the confirm Dialog).',
  );
  const ownEvent = React.useRef<React.MouseEvent<HTMLButtonElement> | null>(null);
  const button = (
    <button
      type="button"
      {...native}
      className={cx('ui-btn', 'ui-btn-' + variant, loading && 'is-loading', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (confirm) {
          e.persist?.();
          ownEvent.current = e;
          setAsking(true);
        } else onClick?.(e);
      }}
    >
      {loading ? <Spinner /> : icon ? <IconOf icon={icon} /> : null}
      {children}
    </button>
  );
  if (!confirm) return button;
  return (
    <>
      {button}
      <Dialog
        open={asking}
        onClose={() => setAsking(false)}
        title={confirm.title}
        tone="danger"
        confirmLabel={confirm.confirmLabel ?? (typeof children === 'string' ? children : tr('刪除'))}
        onConfirm={() => {
          setAsking(false);
          if (ownEvent.current) onClick?.(ownEvent.current);
        }}
      >
        {confirm.body}
      </Dialog>
    </>
  );
}
