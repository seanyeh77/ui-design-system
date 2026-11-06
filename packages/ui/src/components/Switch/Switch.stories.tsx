import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/Switch', component: UI.Switch };

const S = React.useState;
function D() {
  const a = S(true),
    b = S(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <UI.Switch label="深色主題" checked={a[0]} onChange={a[1]} />
        深色主題
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <UI.Switch label="通知" checked={b[0]} onChange={b[1]} />
        通知
      </label>
    </div>
  );
}
export const Default = { render: () => <D /> };
