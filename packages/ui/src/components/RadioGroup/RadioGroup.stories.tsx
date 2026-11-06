import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/RadioGroup', component: UI.RadioGroup };

function D() {
  const [v, setV] = React.useState('week');
  return (
    <div style={{ padding: 20 }}>
      <UI.RadioGroup
        label="摘要頻率"
        value={v}
        onChange={setV}
        options={[
          { value: 'day', label: '每天' },
          { value: 'week', label: '每週' },
          { value: 'month', label: '每月' },
        ]}
      />
    </div>
  );
}
export const Default = { render: () => <D /> };
