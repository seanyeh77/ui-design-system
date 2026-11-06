import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/FormGrid', component: UI.FormGrid };

const S = React.useState;
function D() {
  const c = S(''),
    n = S('');
  return (
    <div style={{ padding: 20 }}>
      <UI.FormGrid>
        <UI.TextField label="名稱" required={true} placeholder="輸入名稱" />
        <UI.TextField label="Email" type="email" placeholder="name@example.com" />
        <UI.Select
          label="頻率"
          value={c[0]}
          onChange={c[1]}
          options={[
            { value: 'day', label: '每天' },
            { value: 'week', label: '每週' },
          ]}
        />
        <UI.TextField label="電話" placeholder="0912 345 678" />
        <UI.TextArea className="is-full" label="備註" value={n[0]} onChange={n[1]} />
      </UI.FormGrid>
    </div>
  );
}
export const Default = { render: () => <D /> };
