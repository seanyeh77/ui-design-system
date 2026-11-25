import * as React from 'react';
import { tr } from '../../i18n';
import { Icon } from '../../icons/Icon';
import { cx } from '../../internal/util';
import { useRovingRadio } from '../../internal/roving';
import { FieldErrorIcon, FieldMessage } from '../../internal/Field';
import { ACCENT_SWATCHES, setAccent, storedAccent } from '../../theme';
import { includeIcons } from '../../icons/store';
import phCheck from '../../icons/ph/check';

includeIcons(phCheck);

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
  // Checked when the field is left or Enter is pressed, not on every key: 「#2」 is not wrong yet while typing.
  const [checked, setChecked] = React.useState(false);
  const bad = checked && !!hexIn && !HEX.test(hexIn);
  const ids = React.useId();
  const roving = useRovingRadio(SWATCHES.length, (i) => {
    setHexIn('');
    setChecked(false);
    pick(SWATCHES[i][1]);
  });
  // One Tab stop in the swatches (the chosen one, or the first for a custom color); arrow keys move and choose.
  const tabStop = Math.max(
    0,
    SWATCHES.findIndex(([, hex]) => hex === cur),
  );
  return (
    <div className={cx('ui-field', 'ui-accentpick', className)}>
      {/* A visible label, as every field has. */}
      <div id={ids + '-label'} className="ui-field-label">
        {label || tr('強調色')}
      </div>
      <div role="radiogroup" aria-labelledby={ids + '-label'} className="ui-accentpick-swatches">
        {SWATCHES.map(([name, hex], i) => {
          const on = cur === hex;
          return (
            <button
              key={hex}
              ref={roving.ref(i)}
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
              onKeyDown={roving.onKeyDown(i)}
            >
              {on ? <Icon name="check" size={14} /> : null}
            </button>
          );
        })}
      </div>
      <div className={cx('ui-accentpick-hex', bad && 'has-error')}>
        <span className="ui-accentpick-preview" style={{ background: HEX.test(hexIn) ? hexIn : cur }} />
        <div className="ui-field-box">
          <input
            className={cx('ui-input', bad && 'is-invalid')}
            aria-label={tr('自訂強調色（色碼）')}
            aria-invalid={bad || undefined}
            aria-describedby={ids + '-msg'}
            value={hexIn}
            placeholder={cur}
            onChange={(e) => {
              const x = e.target.value.trim();
              setHexIn(x);
              // A right code applies at once and clears an error; a wrong one waits for blur or Enter.
              if (HEX.test(x)) {
                setChecked(false);
                pick(x.toLowerCase());
              }
            }}
            onBlur={() => setChecked(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setChecked(true);
            }}
          />
          {bad ? <FieldErrorIcon /> : null}
        </div>
      </div>
      <FieldMessage id={ids + '-msg'} error={bad ? tr('色碼格式不正確，請輸入 # 加 6 碼，例如 #2457d6') : undefined} hint={tr('輸入 # 加 6 碼')} />
    </div>
  );
}
