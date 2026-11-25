import * as React from 'react';
import { cx } from '../../internal/util';
import { describedBy, FieldErrorIcon, FieldLabel, FieldMessage, type FieldProps } from '../../internal/Field';

export interface TextFieldProps extends FieldProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'name' | 'required' | 'disabled'> {
  /** The text. */
  value?: string;
  /** Receives the new text, then the native event: onChange={(v) => setName(v)}. */
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** The underlying <input>. */
  ref?: React.Ref<HTMLInputElement>;
}

/** A labelled one-line input with a hint or an error under it. */
export function TextField({ label, hideLabel, hint, error, id, className, required, disabled, onChange, ...native }: TextFieldProps) {
  const auto = React.useId();
  const fieldId = id || auto;
  const msg = error ? fieldId + '-err' : hint ? fieldId + '-hint' : undefined;
  return (
    <div className={cx('ui-field', error && 'has-error', disabled && 'is-disabled', className)}>
      <FieldLabel htmlFor={fieldId} required={required} hidden={hideLabel}>
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
          onChange={onChange ? (e) => onChange(e.target.value, e) : undefined}
          aria-invalid={error ? true : native['aria-invalid']}
          // Your own description first, then the hint or the error.
          aria-describedby={describedBy(native['aria-describedby'], msg)}
        />
        {error ? <FieldErrorIcon /> : null}
      </div>
      {msg ? <FieldMessage id={msg} error={error} hint={hint} /> : null}
    </div>
  );
}
