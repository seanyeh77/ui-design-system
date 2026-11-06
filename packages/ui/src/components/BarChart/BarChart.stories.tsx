import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/BarChart', component: UI.BarChart };

const V = [12, 18, 15, 22, 26, 24, 31, 29, 35, 33, 38, 42];
function D() {
  return (
    <div style={{ padding: '20px 20px 20px 8px', maxWidth: 560 }}>
      <UI.BarChart
        label="每月新增專案"
        unit="個"
        data={V.map((v, i) => {
          return { label: i + 1 + ' 月', short: String(i + 1), value: v };
        })}
      />
    </div>
  );
}
export const Default = { render: () => <D /> };
