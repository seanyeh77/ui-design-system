import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/KpiCard', component: UI.KpiCard };

function D() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16, padding: 20 }}>
      <UI.KpiCard label="營收" value={12840000} format="money" delta={12.4} spark={[8, 9, 8, 10, 11, 10, 12, 13, 12, 14, 15, 14, 16, 17]} />
      <UI.KpiCard label="平均回應時間" value={182} unit="ms" delta={-8.3} good={true} spark={[22, 21, 23, 20, 21, 19, 20, 19, 18, 19, 18, 17, 18, 17]} />
      <UI.KpiCard
        label="錯誤率"
        value={0.42}
        decimals={2}
        unit="%"
        delta={0.06}
        deltaUnit="pt"
        good={false}
        spark={[3, 3, 4, 3, 3, 4, 3, 4, 4, 3, 4, 5, 4, 5]}
      />
    </div>
  );
}
export const Default = { render: () => <D /> };
