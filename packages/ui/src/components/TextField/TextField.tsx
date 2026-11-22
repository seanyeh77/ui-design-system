import * as React from 'react';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { FieldLabel } from '../../internal/Field';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Above the field, always visible. Never only a placeholder. */
  label: string;
  /** Red asterisk after the label. */
  required?: boolean;
  /** One short line under the field. */
  hint?: string;
  /** The cause and the fix: 「日期格式不正確，請寫成 2026/11/14」. Turns the border red and is announced when it appears.
   *  Set it when the field is left (blur) or the form is sent, not on every key; clear it as soon as the value is right. */
  error?: string;
  ref?: React.Ref<HTMLInputElement>;
}

/** A labelled one-line input with a hint or an error under it. */
export function TextField({ label, hint, error, id, className, required, disabled, ...native }: TextFieldProps) {
  const auto = React.useId();
  const fieldId = id || auto;
  const desc = error ? fieldId + '-err' : hint ? fieldId + '-hint' : undefined;
  return (
    <div className={cx('ui-field', error && 'has-error', disabled && 'is-disabled', className)}>
      <FieldLabel htmlFor={fieldId} required={required}>
        {label}
      </FieldLabel>
      <div className="ui-field-box">
        <input
          type="text"
          {...native}
          required={required}
          disabled={disabled}
          id={fieldId}
          className="ui-input"
          aria-invalid={error ? true : undefined}
          aria-describedby={desc}
        />
        {error ? <Icon name="warning-circle" className="ui-field-icon" /> : null}
      </div>
      {error ? (
        // Inserted only while there is an error, keyed by its text: a new error is a new alert node, announced once;
        // the same error on the next render is not read again. The hint is a separate node that never announces.
        <div key={error} id={desc} className="ui-field-error" role="alert">
          {error}
        </div>
      ) : hint ? (
        <div id={desc} className="ui-field-hint">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
