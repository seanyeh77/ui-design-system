import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/DatePicker', component: UI.DatePicker };

function D() {
  const v = React.useState<Date | null>(new Date(2026, 10, 14));
  return (
    <div style={{ padding: 20, minHeight: 420 }}>
      <UI.DatePicker label="截止日期" value={v[0]} onChange={v[1]} />
    </div>
  );
}
export const Default = { render: () => <D /> };
