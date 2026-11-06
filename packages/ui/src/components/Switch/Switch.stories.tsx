import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/Switch', component: UI.Switch };

function D() {
  const [a, setA] = React.useState(true),
    [b, setB] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <UI.Switch label="深色主題" checked={a} onChange={setA} />
        深色主題
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <UI.Switch label="通知" checked={b} onChange={setB} />
        通知
      </label>
    </div>
  );
}
export const Default = { render: () => <D /> };
