import * as React from 'react';
import { IconOf, type IconSource } from '../../icons/Icon';
import { Spinner } from '../../icons/Spinner';
import { cx } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { tr } from '../../i18n';
import { Dialog } from '../Dialog/Dialog';
import { useDisabledFocusRescue } from '../../internal/focus';

interface ButtonBase extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** A verb: 儲存, 刪除, 匯出. No 「確定」or 「好」. */
  children: React.ReactNode;
  /** Shows a spinner and ignores presses while the action runs, keeping focus on the button (aria-disabled, not
   *  disabled); pair it with a progressive label such as 儲存中. */
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
      /** primary: the one main action of a section (solid). secondary (default): everything else (outline). quiet:
       *  low-emphasis and toolbar actions, text only with no border, a gray background on hover. */
      variant?: 'primary' | 'secondary' | 'quiet';
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
  const { variant = 'secondary', loading, icon, className, children, disabled, onClick, ref, ...other } = props;
  const { confirm, confirmed, ...native } = other as typeof other & { confirm?: DangerConfirm; confirmed?: boolean };
  const [asking, setAsking] = React.useState(false);
  devWarn(
    variant === 'danger' && !confirm && !confirmed,
    'Button',
    'a danger button needs confirm={{ title }} (or confirmed when it is the button inside the confirm Dialog).',
  );
  const own = React.useRef<HTMLButtonElement | null>(null);
  // Disabled while it has focus (pressed, then disabled): focus goes to the control before it, not to the page.
  useDisabledFocusRescue(own, disabled);
  const setRef = React.useCallback(
    (el: HTMLButtonElement | null) => {
      own.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.RefObject<HTMLButtonElement | null>).current = el;
    },
    [ref],
  );
  const ownEvent = React.useRef<{ event: React.MouseEvent<HTMLButtonElement>; button: HTMLButtonElement } | null>(null);
  const button = (
    <button
      type="button"
      {...native}
      ref={setRef}
      className={cx('ui-btn', 'ui-btn-' + variant, loading && 'is-loading', className)}
      disabled={disabled}
      // Loading keeps the button focusable: aria-disabled and a press that does nothing, so focus never falls to the page.
      aria-disabled={loading || native['aria-disabled'] || undefined}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (loading) {
          // Also stops a submit button from sending the form again.
          e.preventDefault();
          return;
        }
        if (confirm) {
          // A submit button must not submit before the person confirms.
          e.preventDefault();
          ownEvent.current = { event: e, button: e.currentTarget };
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
        onOpenChange={(o) => !o && setAsking(false)}
        title={confirm.title}
        tone="danger"
        confirmLabel={confirm.confirmLabel ?? (typeof children === 'string' ? children : tr('刪除'))}
        onConfirm={() => {
          setAsking(false);
          const own = ownEvent.current;
          if (!own) return;
          onClick?.(own.event);
          if (own.button.type === 'submit') own.button.form?.requestSubmit(own.button);
        }}
      >
        {confirm.body}
      </Dialog>
    </>
  );
}
