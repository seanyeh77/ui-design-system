import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/Checkbox', component: UI.Checkbox };

function D() {
  const [a, setA] = React.useState(true),
    [b, setB] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: 20 }}>
      <UI.Checkbox label="寄送每週摘要" checked={a} onChange={setA} />
      <UI.Checkbox label="訂閱產品更新" checked={b} onChange={setB} />
      <UI.Checkbox label="部分選取" checked="mixed" />
      <UI.Checkbox label="停用" disabled />
    </div>
  );
}
export const Default = { render: () => <D /> };
