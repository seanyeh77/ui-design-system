import * as React from 'react';
import { cx } from '../../internal/util';
import { FieldErrorIcon, FieldLabel } from '../../internal/Field';
import { format } from '../../format';
import { tr } from '../../i18n';

export interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  label?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  /** Shown as a counter. Default 200. */
  maxLength?: number;
  required?: boolean;
  /** The cause and the fix (「請寫下退款原因」). Red border, the warning icon and this line in place of the hint, announced
   *  when it appears. Set it when the field is left or the form is sent. */
  error?: string;
}

/** Multi-line text that grows up to 8 lines, with a character counter. */
export function TextArea({ label, hint, error, value, onChange, maxLength = 200, className, id, required, ...native }: TextAreaProps) {
  const auto = React.useId();
  const fieldId = id || auto;
  const hintId = error ? fieldId + '-err' : hint ? fieldId + '-hint' : undefined;
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight + 2, 8 * 26 + 22) + 'px';
  }, [value]);
  return (
    <div className={cx('ui-field', error && 'has-error', className)}>
      {label ? (
        <FieldLabel htmlFor={fieldId} required={required}>
          {label}
        </FieldLabel>
      ) : null}
      <div className="ui-field-box">
        <textarea
          rows={3}
          {...native}
          ref={ref}
          id={fieldId}
          className="ui-input ui-textarea"
          maxLength={maxLength}
          value={value || ''}
          aria-required={required || undefined}
          aria-describedby={[native['aria-describedby'], hintId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {error ? <FieldErrorIcon /> : null}
      </div>
      <div className="ui-field-foot">
        {error ? (
          <span key={error} id={hintId} className="ui-field-error" role="alert">
            {error}
          </span>
        ) : (
          <span id={hintId} className="ui-field-hint">
            {hint || ''}
          </span>
        )}
        <span className="ui-count">
          {/* Shown 「12 / 200」, drawn by CSS; read and copied as 「200 字中的 12 字」, not 「12 斜線 200」. */}
          <span aria-hidden="true">
            <span className="ui-seen" data-text={format.fraction((value || '').length, maxLength)} />
          </span>
          <span className="ui-visually-hidden">{format.fractionLabel((value || '').length, maxLength, tr('字'))}</span>
        </span>
      </div>
    </div>
  );
}
