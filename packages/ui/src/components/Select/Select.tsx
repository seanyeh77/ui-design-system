import * as React from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { Combobox } from '@base-ui/react/combobox';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { FieldErrorIcon, FieldLabel, FieldMessage } from '../../internal/Field';
import { includeIcons } from '../../icons/store';
import phCaretDown from '../../icons/ph/caret-down';
import phCheck from '../../icons/ph/check';
import phMagnifyingGlass from '../../icons/ph/magnifying-glass';

includeIcons(phCaretDown, phCheck, phMagnifyingGlass);

export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<V extends string = string> {
  /** Shown above the trigger. Without it, pass aria-label. */
  label?: string;
  'aria-label'?: string;
  value?: V | null;
  onChange?: (value: V) => void;
  options: SelectOption<V>[];
  /** A search box at the top of the list. Default: on when there are more than 8 options. */
  searchable?: boolean;
  /** Default 「請選擇」. */
  placeholder?: string;
  /** Default 「搜尋」. */
  searchPlaceholder?: string;
  /** Red asterisk after the label. */
  required?: boolean;
  disabled?: boolean;
  /** The cause and the fix (「請選擇部門」). Red border, the warning icon and this line under the field, announced when it
   *  appears. `backticks` are code. */
  error?: string;
  /** Form field name; the value is submitted with the form. */
  name?: string;
  className?: string;
}

/** Pick one option from a list. Use it instead of a native <select>; a search box appears above 8 options. */
export function Select<V extends string = string>(props: SelectProps<V>) {
  const {
    label,
    value,
    onChange,
    options,
    searchable = options.length > 8,
    placeholder,
    searchPlaceholder,
    required,
    disabled,
    error,
    name,
    className,
  } = props;
  const labelId = React.useId();
  const current = options.find((o) => o.value === value) ?? null;
  const head = label ? (
    <FieldLabel id={labelId} required={required}>
      {label}
    </FieldLabel>
  ) : null;
  const trigger = (
    <>
      <span className={cx(!current && 'is-placeholder')}>{current ? current.label : placeholder || tr('請選擇')}</span>
      {error ? <FieldErrorIcon inline /> : null}
      <Icon name="caret-down" size={16} className="ui-select-chev" />
    </>
  );
  const errId = labelId + '-err';
  const message = <FieldMessage id={errId} error={error} />;
  const optionBody = (o: SelectOption<V>, on: boolean) => (
    <>
      <span>{o.label}</span>
      {on ? <Icon name="check" size={16} /> : null}
    </>
  );
  const labelling = {
    'aria-labelledby': label ? labelId : undefined,
    'aria-label': label ? undefined : props['aria-label'],
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errId : undefined,
  };
  const triggerClass = cx('ui-select-trigger', error && 'is-invalid');

  if (searchable) {
    return (
      <div className={cx('ui-select', className)}>
        {head}
        <Combobox.Root
          items={options}
          value={current}
          onValueChange={(o: SelectOption<V> | null) => o && onChange?.(o.value)}
          itemToStringLabel={(o: SelectOption<V>) => o.label}
          isItemEqualToValue={(a: SelectOption<V>, b: SelectOption<V>) => a.value === b.value}
          disabled={disabled}
          required={required}
          name={name}
        >
          <Combobox.Trigger className={triggerClass} {...labelling}>
            {trigger}
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner className="ui-select-positioner" align="start" sideOffset={6}>
              <Combobox.Popup className="ui-select-menu" aria-label={label || props['aria-label']}>
                <div className="ui-select-search">
                  <Icon name="magnifying-glass" size={14} />
                  <Combobox.Input placeholder={searchPlaceholder || tr('搜尋')} aria-label={searchPlaceholder || tr('搜尋')} />
                </div>
                <Combobox.Empty className="ui-select-empty">{tr('找不到符合的選項')}</Combobox.Empty>
                <Combobox.List>
                  {(o: SelectOption<V>) => (
                    <Combobox.Item key={o.value} value={o} disabled={o.disabled} className={cx('ui-select-opt', o.value === value && 'is-on')}>
                      {optionBody(o, o.value === value)}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
        {message}
      </div>
    );
  }
  return (
    <div className={cx('ui-select', className)}>
      {head}
      <BaseSelect.Root
        items={options}
        value={value ?? null}
        onValueChange={(v) => v != null && onChange?.(v as V)}
        disabled={disabled}
        required={required}
        name={name}
      >
        <BaseSelect.Trigger className={triggerClass} {...labelling}>
          {trigger}
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner className="ui-select-positioner" alignItemWithTrigger={false} align="start" sideOffset={6}>
            <BaseSelect.Popup className="ui-select-menu">
              <BaseSelect.List>
                {options.map((o) => (
                  <BaseSelect.Item key={o.value} value={o.value} disabled={o.disabled} className={cx('ui-select-opt', o.value === value && 'is-on')}>
                    {optionBody(o, o.value === value)}
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
      {message}
    </div>
  );
}
