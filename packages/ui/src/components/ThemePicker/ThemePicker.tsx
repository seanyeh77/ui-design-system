import * as React from 'react';
import { tr } from '../../i18n';
import { cx } from '../../internal/util';
import { useRovingRadio } from '../../internal/roving';
import { setTheme, storedTheme, type ThemeSetting } from '../../theme';

const THEMES: { id: ThemeSetting; label: string }[] = [
  { id: 'auto', label: '自動' },
  { id: 'light', label: '淺色' },
  { id: 'dark', label: '深色' },
];

export interface ThemePickerProps {
  /** Controlled value. Without it, the picker reads and sets the stored theme itself. */
  value?: ThemeSetting;
  /** Without it, picking applies the theme with setTheme. */
  onChange?: (theme: ThemeSetting) => void;
  /** Default 「主題」. */
  label?: string;
  className?: string;
}

/** Three preview cards (自動、淺色、深色) for the settings page under 外觀. */
export function ThemePicker({ value, onChange, label, className }: ThemePickerProps) {
  const [own, setOwn] = React.useState<ThemeSetting>(() => value ?? storedTheme());
  const cur = value ?? own;
  const pick = (id: ThemeSetting) => {
    setOwn(id);
    if (onChange) onChange(id);
    else setTheme(id);
  };
  // One Tab stop (the chosen card); arrow keys move to the next card and choose it, as in RadioGroup.
  const roving = useRovingRadio(THEMES.length, (i) => pick(THEMES[i].id));
  const labelId = React.useId();
  const tabStop = Math.max(
    0,
    THEMES.findIndex((t) => t.id === cur),
  );
  return (
    <div className={cx('ui-field', className)}>
      {/* A visible label, as every field has. */}
      <div id={labelId} className="ui-field-label">
        {label || tr('主題')}
      </div>
      <div role="radiogroup" aria-labelledby={labelId} className="ui-themepick">
        {THEMES.map((t, i) => (
          <button
            key={t.id}
            ref={roving.ref(i)}
            type="button"
            role="radio"
            aria-checked={cur === t.id}
            tabIndex={i === tabStop ? 0 : -1}
            className={cx('ui-themepick-opt', cur === t.id && 'is-on')}
            onClick={() => pick(t.id)}
            onKeyDown={roving.onKeyDown(i)}
          >
            <span className={'ui-themepick-mini is-' + t.id} aria-hidden="true">
              <span />
              <span />
            </span>
            {tr(t.label)}
          </button>
        ))}
      </div>
    </div>
  );
}
