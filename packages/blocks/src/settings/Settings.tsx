import * as React from 'react';
import { AccentPicker, DangerZone, SettingsLayout, SettingsSection, Switch, TextField, ThemePicker } from '@seanyeh77/ui';

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
  const [toast, setToast] = React.useState('');
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const save = (next: Partial<SettingsValues>) => {
    onChange({ ...values, ...next });
    setToast('已儲存');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 3000);
  };
  const row = (label: string, control: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', minHeight: 'var(--touch-target)' }}>
      <span>{label}</span>
      {control}
    </div>
  );
  return (
    <SettingsLayout
      title="設定"
      toast={toast}
      categories={[
        {
          id: 'account',
          label: '帳號',
          content: (
            <>
              <SettingsSection title="個人資料">
                <TextField label="名稱" value={values.name} onChange={(e) => save({ name: e.target.value })} />
                <TextField label="Email" type="email" value={values.email} onChange={(e) => save({ email: e.target.value })} />
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
  );
}
