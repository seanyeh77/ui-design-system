import * as React from 'react';
import { cx } from '../../internal/util';
import { describedBy, FieldErrorIcon, FieldLabel, type FieldProps } from '../../internal/Field';
import { format } from '../../format';
import { tr } from '../../i18n';
import { announce } from '../../announce';
import { codeText } from '../InlineCode/InlineCode';

export interface TextAreaProps
  extends FieldProps, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value' | 'name' | 'required' | 'disabled'> {
  /** The text. */
  value: string;
  /** Receives the new text, then the native event. */
  onChange: (value: string, event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** Shown as a counter. Default 200. */
  maxLength?: number;
}

/** Multi-line text that grows up to 8 lines, with a character counter. */
export function TextArea({ label, hideLabel, hint, error, value, onChange, maxLength = 200, className, id, required, disabled, ...native }: TextAreaProps) {
  const auto = React.useId();
  const fieldId = id || auto;
  const hintId = error ? fieldId + '-err' : hint ? fieldId + '-hint' : undefined;
  const countId = fieldId + '-count';
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight + 2, 8 * 26 + 22) + 'px';
  }, [value]);
  const len = (value || '').length;
  // Reaching the limit is said once, as it happens: typing stops there and the counter alone does not say why.
  const full = len >= maxLength;
  const wasFull = React.useRef(full);
  React.useEffect(() => {
    if (full && !wasFull.current) announce(tr('已達 {n} 字上限', { n: maxLength }));
    wasFull.current = full;
  }, [full, maxLength]);
  return (
    <div className={cx('ui-field', error && 'has-error', disabled && 'is-disabled', className)}>
      <FieldLabel htmlFor={fieldId} required={required} hidden={hideLabel}>
        {label}
      </FieldLabel>
      <div className="ui-field-box">
        <textarea
          rows={3}
          {...native}
          ref={ref}
          id={fieldId}
          disabled={disabled}
          className="ui-input ui-textarea"
          maxLength={maxLength}
          value={value || ''}
          aria-required={required || undefined}
          // Your own description, the hint or error, then the counter.
          aria-describedby={describedBy(native['aria-describedby'], hintId, countId)}
          aria-invalid={error ? true : native['aria-invalid']}
          onChange={(e) => onChange(e.target.value, e)}
        />
        {error ? <FieldErrorIcon /> : null}
      </div>
      <div className="ui-field-foot">
        {error ? (
          <span key={error} id={hintId} className="ui-field-error" role="alert">
            {codeText(error)}
          </span>
        ) : (
          <span id={hintId} className="ui-field-hint">
            {codeText(hint || '')}
          </span>
        )}
        <span className="ui-count">
          {/* Shown 「12 / 200」, drawn by CSS; read and copied as 「200 字中的 12 字」, not 「12 斜線 200」. */}
          <span aria-hidden="true">
            <span className="ui-seen" data-text={format.fraction(len, maxLength)} />
          </span>
          <span id={countId} className="ui-visually-hidden">
            {format.fractionLabel(len, maxLength, tr('字'))}
          </span>
        </span>
      </div>
    </div>
  );
}
