import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Pages/LoginCard', component: UI.LoginCard };

function D() {
  const e = React.useState<{ account?: string; password?: string } | null>(null),
    ok = React.useState(false);
  return (
    <div style={{ height: 520 }}>
      <UI.LoginCard
        brand={React.createElement(React.Fragment, null, <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent)' }} />, '專案名稱')}
        forgotHref="#"
        error={e[0]}
        onSubmit={function (v) {
          if (v.account === 'sean' && v.password === '1234') {
            e[1](null);
            ok[1](true);
          } else {
            ok[1](false);
            e[1]({ password: '帳號或密碼不正確，請再試一次。' });
          }
        }}
      />
      {ok[0] ? <div style={{ textAlign: 'center', marginTop: -40, fontSize: 13 }}>登入成功（示範帳號 sean／1234）</div> : null}
    </div>
  );
}
export const Default = { render: () => <D /> };
