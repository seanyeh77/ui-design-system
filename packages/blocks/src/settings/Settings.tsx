import * as React from 'react';
import { AccentPicker, DangerZone, SettingsLayout, SettingsSection, Switch, TextField, ThemePicker, Toaster, toast } from '@seanyeh77/ui';

/* Settings page: categories on the left, sections on the right. Changes save at once and show 「已儲存」;
   there is no save button. Delete-type actions go last in a DangerZone. */

export interface SettingsValues {
  name: string;
  email: string;
  notifyEmail: boolean;
  notifyWeekly: boolean;
}

export interface SettingsProps {
  values: SettingsValues;
  onChange: (values: SettingsValues) => void;
  onDeleteAccount: () => void;
}

export function Settings({ values, onChange, onDeleteAccount }: SettingsProps) {
  const save = (next: Partial<SettingsValues>) => {
    onChange({ ...values, ...next });
    // One 「已儲存」 that restarts its 3 s on every change, not a new one per key.
    toast('已儲存', { id: 'saved' });
  };
  const row = (label: string, control: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', minHeight: 'var(--touch-target)' }}>
      <span style={{ fontSize: 'var(--text-control)' }}>{label}</span>
      {control}
    </div>
  );
  return (
    <>
      <Toaster />
      <SettingsLayout
        title="設定"
        categories={[
          {
            id: 'account',
            label: '帳號',
            content: (
              <>
                <SettingsSection title="個人資料">
                  <TextField label="名稱" value={values.name} onChange={(v) => save({ name: v })} />
                  <TextField label="Email" type="email" value={values.email} onChange={(v) => save({ email: v })} />
                </SettingsSection>
                <DangerZone
                  description="刪除後，所有專案和資料都無法復原。"
                  actionLabel="刪除帳號"
                  confirm={{ title: '刪除帳號？', body: '所有專案和資料會一起刪除，無法復原。' }}
                  onAction={onDeleteAccount}
                />
              </>
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
            id: 'notifications',
            label: '通知',
            content: (
              <SettingsSection title="通知">
                {row('部署失敗時寄 Email', <Switch label="部署失敗時寄 Email" checked={values.notifyEmail} onChange={(v) => save({ notifyEmail: v })} />)}
                {row('每週摘要', <Switch label="每週摘要" checked={values.notifyWeekly} onChange={(v) => save({ notifyWeekly: v })} />)}
              </SettingsSection>
            ),
          },
        ]}
      />
    </>
  );
}
