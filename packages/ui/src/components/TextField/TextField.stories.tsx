import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/TextField', component: UI.TextField };

export const Default = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, padding: 20 }}>
      <UI.TextField label="名稱" placeholder="輸入名稱" hint="說明文字放在欄位下方" />
      <UI.TextField label="Email" type="email" defaultValue="name@" error="Email 格式不正確，例如 name@example.com" />
      <UI.TextField label="帳號" defaultValue="seanyeh" disabled={true} />
    </div>
  ),
};
