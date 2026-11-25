import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { CheckMark, FieldErrorIcon, FieldLabel, FieldMessage, type FieldProps } from '../../internal/Field';
import { includeIcons } from '../../icons/store';
import phX from '../../icons/ph/x';

includeIcons(phX);

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps extends FieldProps {
  /** The options, each { value, label }. */
  options: MultiSelectOption[];
  /** The chosen values, in the order they were picked. */
  value: string[];
  /** Receives every chosen value after a change. */
  onChange: (value: string[]) => void;
  /** Allow adding values that are not in options (Enter, or the 「新增」 row). */
  creatable?: boolean;
  /** Chips shown before 「+n」. Default 2. */
  maxChips?: number;
  /** Default 「搜尋」. */
  placeholder?: string;
  /** Default 「找不到符合的選項」. */
  emptyText?: string;
  className?: string;
}

const CREATE = '\u0000create:';

/** Pick several options: chips inside the field, type to filter, Backspace removes the last chip. */
export function MultiSelect({
  label,
  hideLabel,
  hint,
  error,
  required,
  disabled,
  name,
  options,
  value,
  onChange,
  creatable,
  maxChips = 2,
  placeholder,
  emptyText,
  className,
}: MultiSelectProps) {
  const id = React.useId();
  const [query, setQuery] = React.useState('');
  const labels = React.useMemo(() => new Map(options.map((o) => [o.value, o.label])), [options]);
  const labelOf = (v: string) => (v.startsWith(CREATE) ? tr('新增「{q}」', { q: v.slice(CREATE.length) }) : (labels.get(v) ?? v));
  const q = query.trim();
  const exists = options.some((o) => o.label === q) || value.includes(q);
  const items = [...options.map((o) => o.value), ...value.filter((v) => !labels.has(v)), ...(creatable && q && !exists ? [CREATE + q] : [])];
  const shown = value.slice(0, maxChips);
  const more = value.length - shown.length;
  return (
    <div className={cx('ui-field', error && 'has-error', disabled && 'is-disabled', className)}>
      <FieldLabel htmlFor={id} required={required} hidden={hideLabel}>
        {label}
      </FieldLabel>
      <Combobox.Root
        multiple
        name={name}
        disabled={disabled}
        required={required}
        autoHighlight
        items={items}
        value={value}
        inputValue={query}
        onInputValueChange={setQuery}
        itemToStringLabel={labelOf}
        onValueChange={(next: string[]) => {
          onChange(next.map((v) => (v.startsWith(CREATE) ? v.slice(CREATE.length) : v)));
          setQuery('');
        }}
      >
        <Combobox.InputGroup className={cx('ui-ms', error && 'is-invalid')}>
          <Combobox.Chips className="ui-ms-chips">
            {shown.map((v) => (
              <Combobox.Chip key={v} className="ui-chip" aria-label={labelOf(v)}>
                {labelOf(v)}
                <Combobox.ChipRemove className="ui-chip-x" aria-label={tr('移除 {name}', { name: labelOf(v) })}>
                  <Icon name="x" size={12} />
                </Combobox.ChipRemove>
              </Combobox.Chip>
            ))}
            {more > 0 ? (
              // Seen as 「+3」; read as 「另外 3 個：…」 with the names the chips leave out.
              <span className="ui-chip-more" title={value.slice(maxChips).map(labelOf).join(tr('、'))}>
                <span aria-hidden="true">{'+' + more}</span>
                <span className="ui-visually-hidden">{tr('另外 {n} 個：{list}', { n: more, list: value.slice(maxChips).map(labelOf).join(tr('、')) })}</span>
              </span>
            ) : null}
            <Combobox.Input
              id={id}
              className="ui-ms-input"
              aria-invalid={error ? true : undefined}
              aria-required={required || undefined}
              aria-describedby={error || hint ? id + '-err' : undefined}
              placeholder={value.length ? '' : placeholder || tr('搜尋')}
              onKeyDown={(e) => {
                // Hidden chips (+n) still count: Backspace removes the last value, not the last visible chip.
                if (e.key === 'Backspace' && !query && value.length) {
                  e.preventBaseUIHandler();
                  onChange(value.slice(0, -1));
                }
              }}
            />
          </Combobox.Chips>
          {error ? <FieldErrorIcon inline /> : null}
        </Combobox.InputGroup>
        <Combobox.Portal>
          <Combobox.Positioner className="ui-float is-match" align="start" sideOffset={6}>
            <Combobox.Popup className="ui-select-menu ui-ms-menu">
              <Combobox.Empty className="ui-select-empty">{emptyText || tr('找不到符合的選項')}</Combobox.Empty>
              <Combobox.List>
                {(v: string) =>
                  v.startsWith(CREATE) ? (
                    <Combobox.Item key={v} value={v} className="ui-select-opt ui-ms-create">
                      {labelOf(v)}
                    </Combobox.Item>
                  ) : (
                    <Combobox.Item key={v} value={v} className={cx('ui-select-opt', 'ui-ms-opt', value.includes(v) && 'is-on')}>
                      <span className={cx('ui-check-box', value.includes(v) && 'is-on')} aria-hidden="true">
                        <CheckMark v={value.includes(v)} />
                      </span>
                      <span>{labelOf(v)}</span>
                    </Combobox.Item>
                  )
                }
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
      <FieldMessage id={id + '-err'} error={error} hint={hint} />
    </div>
  );
}
