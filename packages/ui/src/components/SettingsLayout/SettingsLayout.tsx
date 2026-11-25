import * as React from 'react';
import { tr } from '../../i18n';
import { cx } from '../../internal/util';
import { devWarn } from '../../internal/dev';
import { ShellTitle } from '../../internal/shell';
import { announce } from '../../announce';
import { AutoToaster, toast as showToast } from '../Toast/Toast';
import { codeText } from '../InlineCode/InlineCode';

export interface SettingsCategory {
  /** Also the URL hash of the category (#notifications): letters, digits and hyphens. */
  id: string;
  /** The name in the category list, a noun: 「通知」. */
  label: string;
  /** SettingsSections; a DangerZone goes last in the last category. */
  content: React.ReactNode;
}

export interface SettingsLayoutProps {
  /** The page title. Inside AppShell leave it out and give AppShell title="設定": the title shows once. */
  title?: string;
  /** The categories, in order. */
  categories: SettingsCategory[];
  /** Controlled category id. */
  value?: string;
  /** Called with the category id when another category is chosen. */
  onChange?: (id: string) => void;
  /** Uncontrolled: keep the open category in the URL hash (#notifications), so a reload or a shared link opens it.
   *  Default true. */
  urlSync?: boolean;
  /** @deprecated call toast('已儲存', { id: 'saved' }) when a change is saved; AppShell shows it. Until removed: a
   *  non-empty text shows through toast(), an empty one closes it. */
  toast?: string;
  /** Extra class on the root element. */
  className?: string;
}

/** A settings page: categories on the left, their sections on the right. Changes save at once. */
export function SettingsLayout({ title, categories, value, onChange, urlSync = true, toast, className }: SettingsLayoutProps) {
  const shell = React.useContext(ShellTitle);
  devWarn(
    toast !== undefined,
    'SettingsLayout',
    "toast is deprecated: call toast('已儲存', { id: 'saved' }) from @seanyeh77/ui when a change is saved. AppShell shows it above the phone tab bar; outside AppShell put one <Toaster /> on the page.",
  );
  // The old prop, through the toast system: one toast that restarts when the text changes, closed when it is emptied.
  React.useEffect(() => {
    if (toast === undefined) return;
    if (toast) showToast(toast, { id: 'ui-settings-saved' });
    else showToast.close('ui-settings-saved');
  }, [toast]);
  devWarn(
    title && shell.title,
    'SettingsLayout',
    'the page title shows twice: AppShell has `title` and SettingsLayout has `title`. Inside AppShell, give the title to AppShell only.',
  );
  const sync = urlSync && value === undefined;
  const fromHash = () => {
    if (!sync || typeof location === 'undefined') return undefined;
    const id = decodeURIComponent(location.hash.slice(1));
    return categories.some((c) => c.id === id) ? id : undefined;
  };
  const [own, setOwn] = React.useState<string | undefined>(() => fromHash() ?? value ?? categories[0]?.id);
  const active = value ?? own;
  const item = categories.find((c) => c.id === active) ?? categories[0];
  // A link or the back button that changes the hash opens that category.
  React.useEffect(() => {
    if (!sync) return;
    const onHash = () => {
      const id = fromHash();
      if (id) setOwn(id);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- categories are read when the hash changes
  }, [sync]);
  const choose = (c: SettingsCategory) => {
    if (c.id === item?.id) return;
    setOwn(c.id);
    if (sync) history.replaceState(history.state, '', location.pathname + location.search + '#' + encodeURIComponent(c.id));
    announce(c.label);
    onChange?.(c.id);
  };
  return (
    <div className={cx('ui-settings', className)}>
      {title ? <h1 className="ui-settings-title">{title}</h1> : null}
      <div className="ui-settings-body">
        <nav className="ui-settings-nav" aria-label={tr('設定分類')}>
          {categories.map((c) => {
            const on = c.id === item?.id;
            return (
              <button
                key={c.id}
                type="button"
                className={cx('ui-settings-cat', on && 'is-on')}
                aria-current={on ? 'page' : undefined}
                onClick={() => choose(c)}
              >
                {c.label}
              </button>
            );
          })}
        </nav>
        <div className="ui-settings-content">{item?.content}</div>
      </div>
      {toast !== undefined ? <AutoToaster /> : null}
    </div>
  );
}

export interface SettingsSectionProps {
  /** The section's heading, 17 px like a Card title. */
  title?: string;
  /** One sentence under the title; `backticks` are code. */
  description?: string;
  /** Fields and SettingsRows. */
  children?: React.ReactNode;
  /** Extra class on the root element. */
  className?: string;
}

/** One group of settings with a heading. It is a card on its own; inside a Card it drops its shadow. */
export function SettingsSection({ title, description, children, className }: SettingsSectionProps) {
  return (
    <section className={cx('ui-settings-section', className)}>
      {title ? <h2 className="ui-settings-h">{title}</h2> : null}
      {description ? <p className="ui-settings-desc">{codeText(description)}</p> : null}
      {children}
    </section>
  );
}

export interface SettingsRowProps {
  /** What the setting does, a short noun phrase: 「部署失敗時寄 Email」. Also give it to the Switch's `label`. */
  label: string;
  /** One sentence under the label; `backticks` are code. */
  description?: string;
  /** The control at the right end: a Switch (or a Select). */
  children: React.ReactElement<{ 'aria-describedby'?: string }>;
  /** Extra class on the root element. */
  className?: string;
}

/** One setting on one row: the label and a sentence on the left, the control on the right. The whole row is a
 *  `<label>`, so clicking the text toggles a Switch. */
export function SettingsRow({ label, description, children, className }: SettingsRowProps) {
  const id = React.useId();
  const control = description && React.isValidElement(children) ? React.cloneElement(children, { 'aria-describedby': id }) : children;
  return (
    <label className={cx('ui-settings-row', className)}>
      <span className="ui-settings-rowtext">
        <span className="ui-settings-rowlabel">{label}</span>
        {description ? (
          <span id={id} className="ui-settings-rowdesc">
            {codeText(description)}
          </span>
        ) : null}
      </span>
      {control}
    </label>
  );
}
