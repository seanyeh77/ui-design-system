import * as React from 'react';
import { tr } from '../../i18n';
import { cx } from '../../internal/util';
import { Toast } from '../Toast/Toast';

export interface SettingsCategory {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface SettingsLayoutProps {
  title?: string;
  categories: SettingsCategory[];
  /** Controlled category id. */
  value?: string;
  onChange?: (id: string) => void;
  /** Text of the 「已儲存」 toast; empty hides it. Changes save on their own, so there is no save button. */
  toast?: string;
  className?: string;
}

/** A settings page: categories on the left, their sections on the right. Changes save at once. */
export function SettingsLayout({ title, categories, value, onChange, toast, className }: SettingsLayoutProps) {
  const [own, setOwn] = React.useState(value ?? categories[0]?.id);
  const active = value ?? own;
  const item = categories.find((c) => c.id === active) ?? categories[0];
  return (
    <div className={cx('ui-settings', className)}>
      {title ? <h1 className="ui-settings-title">{title}</h1> : null}
      <div className="ui-settings-body">
        <nav className="ui-settings-nav" aria-label={tr('設定分類')}>
          {categories.map((c) => {
            const on = c.id === active;
            return (
              <button
                key={c.id}
                type="button"
                className={cx('ui-settings-cat', on && 'is-on')}
                aria-current={on ? 'page' : undefined}
                onClick={() => {
                  setOwn(c.id);
                  onChange?.(c.id);
                }}
              >
                {c.label}
              </button>
            );
          })}
        </nav>
        <div className="ui-settings-content">{item?.content}</div>
      </div>
      {toast ? (
        <div className="ui-settings-toast">
          <Toast>{toast}</Toast>
        </div>
      ) : null}
    </div>
  );
}

export interface SettingsSectionProps {
  title?: string;
  /** One sentence under the title. */
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

/** One group of settings with a heading. It is a card on its own; inside a Card it drops its shadow. */
export function SettingsSection({ title, description, children, className }: SettingsSectionProps) {
  return (
    <section className={cx('ui-settings-section', className)}>
      {title ? <h2 className="ui-settings-h">{title}</h2> : null}
      {description ? <p className="ui-settings-desc">{description}</p> : null}
      {children}
    </section>
  );
}
