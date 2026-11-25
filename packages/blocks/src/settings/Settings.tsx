import * as React from 'react';
import {
  AccentPicker,
  AppShell,
  DangerZone,
  SettingsLayout,
  SettingsRow,
  SettingsSection,
  Switch,
  TextField,
  ThemePicker,
  toast,
  type NavSection,
} from '@seanyeh77/ui';

/* Settings page: categories on the left, sections on the right, the open category in the URL hash. Changes save on
   their own and show 「已儲存」; there is no save button. Switches save when they change; a text field saves when it is
   left (blur) and valid, not on every key. Delete-type actions go last, in a DangerZone at the bottom of the last
   category. The title shows once: AppShell's title="設定", none on SettingsLayout. */

export interface SettingsValues {
  name: string;
  email: string;
  notifyEmail: boolean;
  notifyWeekly: boolean;
}

export interface SettingsProps {
  values: SettingsValues;
  /** Store the new values; called once per saved change. */
  onChange: (values: SettingsValues) => void;
  onDeleteAccount: () => void;
}

const NAV: NavSection[] = [
  {
    items: [
      { id: 'overview', label: '總覽', icon: 'house' },
      { id: 'projects', label: '專案', icon: 'folder' },
    ],
  },
  { items: [{ id: 'settings', label: '設定', icon: 'gear' }] },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Settings({ values, onChange, onDeleteAccount }: SettingsProps) {
  const save = (next: Partial<SettingsValues>) => {
    onChange({ ...values, ...next });
    // One 「已儲存」 that restarts its 3 s on every change, not a new one per key.
    toast('已儲存', { id: 'saved' });
  };

  // Text fields: a draft while typing; saved when the field is left and the value is valid and changed.
  const [name, setName] = React.useState(values.name);
  const [email, setEmail] = React.useState(values.email);
  const nameError = name.trim() ? undefined : '名稱不能空白，請輸入顯示名稱。';
  const emailError = EMAIL.test(email) ? undefined : 'Email 格式不正確，例如 name@example.com';
  const [left, setLeft] = React.useState({ name: false, email: false });

  return (
    <AppShell nav={NAV} value="settings" onNavigate={() => {}} brand="專案中心" title="設定">
      <SettingsLayout
        categories={[
          {
            id: 'profile',
            label: '個人資料',
            content: (
              <SettingsSection title="個人資料">
                <TextField
                  label="名稱"
                  value={name}
                  onChange={(v) => setName(v)}
                  onBlur={() => {
                    setLeft((l) => ({ ...l, name: true }));
                    if (!nameError && name.trim() !== values.name) save({ name: name.trim() });
                  }}
                  error={left.name ? nameError : undefined}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(v) => setEmail(v)}
                  onBlur={() => {
                    setLeft((l) => ({ ...l, email: true }));
                    if (!emailError && email !== values.email) save({ email });
                  }}
                  error={left.email ? emailError : undefined}
                />
              </SettingsSection>
            ),
          },
          {
            id: 'notifications',
            label: '通知',
            content: (
              <SettingsSection title="通知">
                <SettingsRow label="部署失敗時寄 Email" description="寄到個人資料裡的 Email。">
                  <Switch label="部署失敗時寄 Email" checked={values.notifyEmail} onChange={(v) => save({ notifyEmail: v })} />
                </SettingsRow>
                <SettingsRow label="每週摘要" description="每週一早上寄出上週的進度。">
                  <Switch label="每週摘要" checked={values.notifyWeekly} onChange={(v) => save({ notifyWeekly: v })} />
                </SettingsRow>
              </SettingsSection>
            ),
          },
          {
            id: 'appearance',
            label: '外觀',
            content: (
              <SettingsSection title="外觀" description="只影響這個瀏覽器。">
                <ThemePicker />
                <AccentPicker />
              </SettingsSection>
            ),
          },
          {
            id: 'account',
            label: '帳號',
            content: (
              <DangerZone
                title="刪除帳號"
                description="刪除後，所有專案和資料都無法復原。"
                actionLabel="刪除帳號"
                confirm={{ title: '刪除帳號？', body: '所有專案和資料會一起刪除，無法復原。' }}
                onAction={onDeleteAccount}
              />
            ),
          },
        ]}
      />
    </AppShell>
  );
}
