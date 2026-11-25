import * as React from 'react';
import { cx } from '../../internal/util';
import { describedBy, FieldErrorIcon, FieldLabel, FieldMessage, type FieldProps } from '../../internal/Field';

export interface TextFieldProps
  extends FieldProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'name' | 'required' | 'disabled' | 'prefix'> {
  /** The text. */
  value?: string;
  /** Muted text inside the box before the value, e.g. 「NT$」 or 「https://」. */
  prefix?: string;
  /** Muted text inside the box at its end, e.g. 「元」 or 「.example.com」. */
  suffix?: string;
  /** The value's unit, muted, right after the typed text (「12 GB」), or after the placeholder while empty. */
  unit?: string;
  /** Receives the new text, then the native event: onChange={(v) => setName(v)}. */
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** The underlying <input>. */
  ref?: React.Ref<HTMLInputElement>;
}

/** A labelled one-line input with a hint or an error under it. */
export function TextField({ label, hideLabel, hint, error, id, className, required, disabled, onChange, prefix, suffix, unit, ...native }: TextFieldProps) {
  const auto = React.useId();
  const fieldId = id || auto;
  const msg = error ? fieldId + '-err' : hint ? fieldId + '-hint' : undefined;
  // Uncontrolled with a unit: the typed text, so the unit follows it.
  const [typed, setTyped] = React.useState(String(native.defaultValue ?? ''));
  const affixed = !!(prefix || suffix || unit);
  // Screen readers hear the prefix, suffix and unit with the field's description.
  const affixIds = [prefix && fieldId + '-pre', unit && fieldId + '-unit', suffix && fieldId + '-suf'];
  const input = (
    <input
      type="text"
      {...native}
      required={required}
      disabled={disabled}
      id={fieldId}
      className="ui-input"
      onChange={
        onChange || (unit && native.value === undefined)
          ? (e) => {
              if (unit && native.value === undefined) setTyped(e.target.value);
              onChange?.(e.target.value, e);
            }
          : undefined
      }
      aria-invalid={error ? true : native['aria-invalid']}
      // Your own description first, then the prefix, unit and suffix, then the hint or the error.
      aria-describedby={describedBy(native['aria-describedby'], ...affixIds, msg)}
    />
  );
  const shown = String(native.value ?? typed) || native.placeholder || '';
  return (
    <div className={cx('ui-field', error && 'has-error', disabled && 'is-disabled', className)}>
      <FieldLabel htmlFor={fieldId} required={required} hidden={hideLabel}>
        {label}
      </FieldLabel>
      <div
        className={cx('ui-field-box', affixed && 'has-affix')}
        // A press on the frame outside the input (the prefix, suffix or unit text) focuses the input, as a click on
        // the label does; preventDefault keeps the focus from going to the body first.
        onMouseDown={(e) => {
          const box = e.currentTarget.querySelector('input');
          if (!box || disabled || e.button !== 0 || e.target === box) return;
          e.preventDefault();
          box.focus();
        }}
      >
        {prefix ? (
          <span id={fieldId + '-pre'} className="ui-field-affix">
            {prefix}
          </span>
        ) : null}
        {unit ? (
          // The unit sits after the text: an invisible copy of the text pushes it there.
          <span className="ui-field-unitwrap">
            {input}
            <span className="ui-field-unitline" aria-hidden="true">
              <span className="ui-field-mirror">{shown}</span>
              <span className="ui-field-affix">{(shown ? '\u00a0' : '') + unit}</span>
            </span>
            <span id={fieldId + '-unit'} className="ui-visually-hidden">
              {unit}
            </span>
          </span>
        ) : (
          input
        )}
        {suffix ? (
          <span id={fieldId + '-suf'} className="ui-field-affix">
            {suffix}
          </span>
        ) : null}
        {error ? <FieldErrorIcon inline={affixed} /> : null}
      </div>
      {msg ? <FieldMessage id={msg} error={error} hint={hint} /> : null}
    </div>
  );
}
