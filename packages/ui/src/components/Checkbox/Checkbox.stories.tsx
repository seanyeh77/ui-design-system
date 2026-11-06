import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/Checkbox', component: UI.Checkbox };

const S = React.useState;
function D() {
  const a = S(true),
    b = S(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: 20 }}>
      <UI.Checkbox label="寄送每週摘要" checked={a[0]} onChange={a[1]} />
      <UI.Checkbox label="訂閱產品更新" checked={b[0]} onChange={b[1]} />
      <UI.Checkbox label="部分選取" checked="mixed" />
      <UI.Checkbox label="停用" disabled={true} />
    </div>
  );
}
export const Default = { render: () => <D /> };
