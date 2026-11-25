import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Pages/SettingsLayout', component: UI.SettingsLayout };

function D() {
  const [n, setN] = React.useState('SeanYeh'),
    [a, setA] = React.useState(true);
  // One 「已儲存」 that restarts on every change. Inside AppShell the Toaster is already there.
  const saved = () => UI.toast('已儲存', { id: 'saved' });
  // A text field saves when it is left and valid: onBlur returns whether it is.
  const form = UI.useFormErrors({ name: n }, (v) => ({ name: v.name.trim() ? undefined : '名稱不能空白，請輸入顯示名稱。' }));
  return (
    <div style={{ padding: 20, height: 520, boxSizing: 'border-box', overflow: 'auto' }}>
      <UI.Toaster />
      <UI.SettingsLayout
        title="設定"
        urlSync={false}
        categories={[
          {
            id: 'noti',
            label: '通知',
            content: (
              <UI.SettingsSection
                title="通知"
                description="改完會自動儲存。"
                actions={
                  <UI.Button
                    variant="quiet"
                    onClick={() => {
                      setA(true);
                      saved();
                    }}
                  >
                    還原預設
                  </UI.Button>
                }
              >
                <UI.SettingsRow label="Email 通知" description="部署失敗時寄到帳號的 Email。">
                  <UI.Switch
                    label="Email 通知"
                    checked={a}
                    onChange={(v) => {
                      setA(v);
                      saved();
                    }}
                  />
                </UI.SettingsRow>
              </UI.SettingsSection>
            ),
          },
          {
            id: 'profile',
            label: '個人資料',
            content: (
              <UI.SettingsSection title="個人資料">
                <UI.TextField label="名稱" value={n} onChange={setN} onBlur={() => form.onBlur('name') && saved()} error={form.errors.name} />
              </UI.SettingsSection>
            ),
          },
          {
            id: 'security',
            label: '安全性',
            content: (
              <React.Fragment>
                <UI.SettingsSection title="安全性">兩步驟驗證、登入紀錄</UI.SettingsSection>
                <UI.DangerZone
                  title="刪除帳號"
                  description="刪除後，所有專案和資料都無法復原。"
                  actionLabel="刪除帳號"
                  confirm={{ title: '刪除帳號？', body: '所有專案和資料會一起刪除，無法復原。' }}
                  onAction={() => {}}
                />
              </React.Fragment>
            ),
          },
        ]}
      />
    </div>
  );
}
export const Default = { render: () => <D /> };
