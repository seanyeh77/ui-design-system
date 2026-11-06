import * as React from 'react';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx, store } from '../../internal/util';
import { ACCENT_KEY, DEFAULT_ACCENT, setAccent } from '../../theme';

const SWATCHES: [name: string, hex: string][] = [
  ['藍', '#2457d6'],
  ['靛', '#5b4fd6'],
  ['紫', '#8a4fd6'],
  ['桃紅', '#c2407a'],
  ['紅', '#cd3a2f'],
  ['橘', '#c4600f'],
  ['綠', '#1b8a4d'],
  ['青', '#0f8a85'],
];
const HEX = /^#[0-9a-fA-F]{6}$/;

export interface AccentPickerProps {
  /** Controlled #rrggbb. Without it, the picker reads and sets the stored accent itself. */
  value?: string;
  /** Without it, picking applies the color with setAccent. */
  onChange?: (hex: string) => void;
  /** Default 「強調色」. */
  label?: string;
  className?: string;
}

/** 8 swatches plus a hex field for any color. */
export function AccentPicker({ value, onChange, label, className }: AccentPickerProps) {
  const [own, setOwn] = React.useState(() => (value || store(ACCENT_KEY) || DEFAULT_ACCENT).toLowerCase());
  const [hexIn, setHexIn] = React.useState('');
  const cur = (value || own).toLowerCase();
  const pick = (c: string) => {
    setOwn(c);
    if (onChange) onChange(c);
    else setAccent(c);
  };
  const bad = !!hexIn && !HEX.test(hexIn);
  return (
    <div className={cx('ui-accentpick', className)}>
      <div role="radiogroup" aria-label={label || tr('強調色')} className="ui-accentpick-swatches">
        {SWATCHES.map(([name, hex]) => {
          const on = cur === hex;
          return (
            <button
              key={hex}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={tr(name)}
              title={tr(name)}
              className={cx('ui-swatch', on && 'is-on')}
              style={{ background: hex, color: hex }}
              onClick={() => {
                setHexIn('');
                pick(hex);
              }}
            >
              {on ? <Icon name="check" size={14} /> : null}
            </button>
          );
        })}
      </div>
      <div className="ui-accentpick-hex">
        <span className="ui-accentpick-preview" style={{ background: !bad && hexIn ? hexIn : cur }} />
        <input
          className={cx('ui-input', bad && 'is-invalid')}
          aria-label={tr('自訂強調色（色碼）')}
          aria-invalid={bad || undefined}
          value={hexIn}
          placeholder={cur}
          onChange={(e) => {
            const x = e.target.value.trim();
            setHexIn(x);
            if (HEX.test(x)) pick(x.toLowerCase());
          }}
        />
        <span className={cx('ui-field-hint', bad && 'is-error')}>{bad ? tr('色碼格式不正確，例如 #2457d6') : tr('輸入 # 加 6 碼')}</span>
      </div>
    </div>
  );
}

