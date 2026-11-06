import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
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
export function MultiSelect({ label, options, value, onChange, creatable, maxChips = 2, placeholder, emptyText, className }: MultiSelectProps) {
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
    <div className={cx('ui-field', className)}>
      {label ? (
        <label htmlFor={id} className="ui-field-label">
          {label}
        </label>
      ) : null}
      <Combobox.Root
        multiple
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
        <Combobox.InputGroup className="ui-ms">
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
              <span className="ui-chip-more" title={value.slice(maxChips).map(labelOf).join('、')}>
                {'+' + more}
              </span>
            ) : null}
            <Combobox.Input
              id={id}
              className="ui-ms-input"
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
                        {value.includes(v) ? <Icon name="check" size={14} /> : null}
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
    </div>
  );
}
