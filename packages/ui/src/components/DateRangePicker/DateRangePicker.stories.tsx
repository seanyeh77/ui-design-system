import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Forms/DateRangePicker', component: UI.DateRangePicker };

function D() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const [v, setV] = React.useState<[Date | null, Date | null]>([new Date(t.getFullYear(), t.getMonth(), t.getDate() - 6), t]);
  return (
    <div style={{ padding: 20, minHeight: 420 }}>
      <UI.DateRangePicker label="報表期間" value={v} onChange={setV} />
    </div>
  );
}
export const Default = { render: () => <D /> };
