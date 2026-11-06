import * as React from 'react';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Above the field, always visible. Never only a placeholder. */
  label: string;
  /** Red asterisk after the label. */
  required?: boolean;
  /** One short line under the field. */
  hint?: string;
  /** The cause and the fix: 「日期格式不正確，請寫成 2026/11/14」. Turns the border red. */
  error?: string;
  ref?: React.Ref<HTMLInputElement>;
}

/** A labelled one-line input with a hint or an error under it. */
export function TextField({ label, hint, error, id, className, required, disabled, ...native }: TextFieldProps) {
  const auto = React.useId();
  const fieldId = id || auto;
  const desc = error || hint ? fieldId + '-desc' : undefined;
  return (
    <div className={cx('ui-field', error && 'has-error', disabled && 'is-disabled', className)}>
      <label htmlFor={fieldId} className="ui-field-label">
        {label}
        {required ? (
          <span className="ui-req" aria-hidden="true">
            {' *'}
          </span>
        ) : null}
      </label>
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
      {desc ? (
        <div id={desc} className={error ? 'ui-field-error' : 'ui-field-hint'}>
          {error || hint}
        </div>
      ) : null}
    </div>
  );
}
