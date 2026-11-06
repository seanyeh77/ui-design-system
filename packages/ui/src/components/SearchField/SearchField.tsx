import type * as React from 'react';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';

export interface SearchFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  /** aria-label. Default 「搜尋」. */
  label?: string;
}

/** A search box with a clear button. Filter as the person types. */
export function SearchField({ value, onChange, className, label, ...native }: SearchFieldProps) {
  return (
    <div className={cx('ui-searchfield', className)}>
      <Icon name="magnifying-glass" size={16} className="ui-searchfield-icon" />
      <input type="search" aria-label={label || tr('搜尋')} {...native} className="ui-input" value={value} onChange={(e) => onChange(e.target.value)} />
      {value ? (
        <button type="button" className="ui-searchfield-clear" aria-label={tr('清除搜尋')} onClick={() => onChange('')}>
          <Icon name="x" size={12} />
        </button>
      ) : null}
    </div>
  );
}
