import * as React from 'react';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { browserKey, cx } from '../../internal/util';
import { ACCENT_SWATCHES, setAccent, storedAccent } from '../../theme';

const SWATCHES = ACCENT_SWATCHES;
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
  const [own, setOwn] = React.useState(() => (value || storedAccent()).toLowerCase());
  const [hexIn, setHexIn] = React.useState('');
  const cur = (value || own).toLowerCase();
  const pick = (c: string) => {
    setOwn(c);
    if (onChange) onChange(c);
    else setAccent(c);
  };
  const bad = !!hexIn && !HEX.test(hexIn);
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  // One Tab stop in the swatches (the chosen one, or the first for a custom color); arrow keys move and choose.
  const tabStop = Math.max(
    0,
    SWATCHES.findIndex(([, hex]) => hex === cur),
  );
  return (
    <div className={cx('ui-accentpick', className)}>
      <div role="radiogroup" aria-label={label || tr('強調色')} className="ui-accentpick-swatches">
        {SWATCHES.map(([name, hex], i) => {
          const on = cur === hex;
          return (
            <button
              key={hex}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={i === tabStop ? 0 : -1}
              aria-label={tr(name)}
              title={tr(name)}
              className={cx('ui-swatch', on && 'is-on')}
              style={{ background: hex, color: hex }}
              onClick={() => {
                setHexIn('');
                pick(hex);
              }}
              onKeyDown={(e) => {
                if (browserKey(e)) return;
                const n = SWATCHES.length;
                const to = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % n : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + n) % n : -1;
                if (to < 0) return;
                e.preventDefault();
                refs.current[to]?.focus();
                setHexIn('');
                pick(SWATCHES[to][1]);
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
