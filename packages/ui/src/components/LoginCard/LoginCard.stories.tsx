import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Pages/LoginCard', component: UI.LoginCard };

function D() {
  const [e, setE] = React.useState<{ account?: string; password?: string } | null>(null),
    [ok, setOk] = React.useState(false);
  return (
    <div style={{ height: 520 }}>
      <UI.LoginCard
        brand={
          <>
            <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent)' }} />
            專案名稱
          </>
        }
        forgotHref="#"
        error={e}
        onSubmit={(v) => {
          if (v.account === 'sean' && v.password === '1234') {
            setE(null);
            setOk(true);
          } else {
            setOk(false);
            setE({ password: '帳號或密碼不正確，請再試一次。' });
          }
        }}
      />
      {ok ? <div style={{ textAlign: 'center', marginTop: -40, fontSize: 13 }}>登入成功（示範帳號 sean／1234）</div> : null}
    </div>
  );
}
export const Default = { render: () => <D /> };
