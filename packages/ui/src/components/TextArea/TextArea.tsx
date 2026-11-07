import * as React from 'react';
import { cx } from '../../internal/util';
import { FieldLabel } from '../../internal/Field';

export interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  label?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  /** Shown as a counter. Default 200. */
  maxLength?: number;
  required?: boolean;
}

/** Multi-line text that grows up to 8 lines, with a character counter. */
export function TextArea({ label, hint, value, onChange, maxLength = 200, className, id, required, ...native }: TextAreaProps) {
  const auto = React.useId();
  const fieldId = id || auto;
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight + 2, 8 * 26 + 22) + 'px';
  }, [value]);
  return (
    <div className={cx('ui-field', className)}>
      {label ? (
        <FieldLabel htmlFor={fieldId} required={required}>
          {label}
        </FieldLabel>
      ) : null}
      <textarea
        rows={3}
        {...native}
        ref={ref}
        id={fieldId}
        className="ui-input ui-textarea"
        maxLength={maxLength}
        value={value || ''}
        aria-required={required || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="ui-field-foot">
        <span className="ui-field-hint">{hint || ''}</span>
        <span className="ui-count">{`${(value || '').length} / ${maxLength}`}</span>
      </div>
    </div>
  );
}
