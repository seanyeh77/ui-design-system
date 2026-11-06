import * as React from 'react';
import { tr } from '../../i18n';
import { cx } from '../../internal/util';
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
  return (
    <div role="radiogroup" aria-label={label || tr('主題')} className={cx('ui-themepick', className)}>
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={cur === t.id}
          className={cx('ui-themepick-opt', cur === t.id && 'is-on')}
          onClick={() => pick(t.id)}
        >
          <span className={'ui-themepick-mini is-' + t.id} aria-hidden="true">
            <span />
            <span />
          </span>
          {tr(t.label)}
        </button>
      ))}
    </div>
  );
}
