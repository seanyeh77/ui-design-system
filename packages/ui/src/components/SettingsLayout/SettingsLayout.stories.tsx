import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Pages/SettingsLayout', component: UI.SettingsLayout };

function D() {
  const [t, setT] = React.useState(''),
    [n, setN] = React.useState('SeanYeh'),
    [a, setA] = React.useState(true),
    tm = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  function saved() {
    setT('已儲存');
    clearTimeout(tm.current);
    tm.current = setTimeout(() => {
      setT('');
    }, 3000);
  }
  return (
    <div style={{ padding: 20, height: 520, boxSizing: 'border-box', overflow: 'auto' }}>
      <UI.SettingsLayout
        title="設定"
        toast={t}
        categories={[
          {
            id: 'profile',
            label: '個人資料',
            content: (
              <UI.SettingsSection title="個人資料">
                <UI.TextField
                  label="名稱"
                  value={n}
                  onChange={(e) => {
                    setN(e.target.value);
                  }}
                  onBlur={saved}
                />
              </UI.SettingsSection>
            ),
          },
          {
            id: 'noti',
            label: '通知',
            content: (
              <UI.SettingsSection title="通知" description="改完會自動儲存。">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Email 通知
                  <UI.Switch
                    label="Email 通知"
                    checked={a}
                    onChange={(v) => {
                      setA(v);
                      saved();
                    }}
                  />
                </label>
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
