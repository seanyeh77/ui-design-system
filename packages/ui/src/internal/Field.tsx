import * as React from 'react';
import { CHECK, Icon } from '../icons/Icon';
import { cx } from './util';
import { includeIcons } from '../icons/store';
import phWarningCircle from '../icons/ph/warning-circle';
import { codeText } from '../components/InlineCode/InlineCode';

includeIcons(phWarningCircle);

/** The props every form field shares (TextField, TextArea, Select, MultiSelect, DatePicker, DateRangePicker). */
export interface FieldProps {
  /** Above the field, always visible, and the field's accessible name. Never only a placeholder. */
  label: string;
  /** Hides the label from sight (a search box in a toolbar); screen readers still read it. */
  hideLabel?: boolean;
  /** One short line under the field; `backticks` are code. */
  hint?: string;
  /** The cause and the fix: 「日期格式不正確，請寫成 2026/11/14」. Red border, a warning icon and this line in place of
   *  the hint. Set it when the field is left or the form is sent (useFormErrors does both). `backticks` are code. */
  error?: string;
  /** Red asterisk after the label; screen readers hear 「必填」. */
  required?: boolean;
  /** Grayed out and skipped by Tab. */
  disabled?: boolean;
  /** Form field name: the value is sent with a native form. */
  name?: string;
}

/** Joins aria-describedby ids, dropping empty ones. */
export const describedBy = (...ids: (string | undefined | null | false)[]): string | undefined => ids.filter(Boolean).join(' ') || undefined;

/** A field's label above it, with the red asterisk when required. A <label> when it names one input, otherwise a <span>. */
export function FieldLabel({
  htmlFor,
  id,
  required,
  hidden,
  children,
}: {
  htmlFor?: string;
  id?: string;
  required?: boolean;
  /** Visually hidden, still read (FieldProps.hideLabel). */
  hidden?: boolean;
  children: React.ReactNode;
}) {
  const Tag = htmlFor ? 'label' : 'span';
  return (
    <Tag htmlFor={htmlFor} id={id} className={cx('ui-field-label', hidden && 'ui-visually-hidden')}>
      {children}
      {required ? (
        <span className="ui-req" aria-hidden="true">
          {' *'}
        </span>
      ) : null}
    </Tag>
  );
}

/** The mark inside a check box: a drawn check, a dash for 'mixed', or nothing. The check draws itself only when it
 *  turns on after mount, never when a list or menu opens with it already on. */
export function CheckMark({ v }: { v: boolean | 'mixed' }) {
  const [prev, setPrev] = React.useState(v);
  const [draw, setDraw] = React.useState(false);
  if (prev !== v) {
    setPrev(v);
    setDraw(v === true);
  }
  if (v === 'mixed') return <span className="ui-check-dash" />;
  if (!v) return null;
  return (
    <svg
      className={cx(draw && 'ui-draw')}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={CHECK} />
    </svg>
  );
}

/** The error mark inside a field with an error: a red warning circle at the field's right end (TextField and every other
 *  field type, so an error always shows the red border and this icon). `inline` sits in a flex row before the field's
 *  own trailing button (show password, calendar, caret) instead of over the input. */
export function FieldErrorIcon({ inline }: { inline?: boolean }) {
  return <Icon name="warning-circle" className={cx('ui-field-icon', inline && 'is-inline')} />;
}

/** Inside it, field errors are not alerts: the form moves focus to the first invalid field on submit, which reads its
 *  error through aria-describedby (several alerts at once would interrupt each other). */
export const QuietErrors = React.createContext(false);

/** The line under a field: the error (cause and fix) when there is one, otherwise the hint. The error is inserted only
 *  while there is one, keyed by its text: a new error is a new alert node, announced once; the hint never announces. */
export function FieldMessage({ id, error, hint, className }: { id: string; error?: string; hint?: React.ReactNode; className?: string }) {
  const quiet = React.useContext(QuietErrors);
  if (error)
    return (
      <div key={error} id={id} className={cx('ui-field-error', className)} role={quiet ? undefined : 'alert'}>
        {codeText(error)}
      </div>
    );
  return hint ? (
    <div id={id} className={cx('ui-field-hint', className)}>
      {codeText(hint)}
    </div>
  ) : null;
}
