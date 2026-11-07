import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/LineChart', component: UI.LineChart };

const L: string[] = [];
for (let i = 0; i < 14; i++) {
  const d = new Date(2026, 9, 22 + i);
  L.push(d.getMonth() + 1 + '/' + d.getDate());
}
function D() {
  return (
    <div style={{ padding: 20 }}>
      <UI.LineChart
        label="每日請求數"
        unit="次"
        labels={L}
        labelEvery={2}
        series={[
          { name: 'API', values: [420, 460, 440, 510, 530, 500, 560, 590, 570, 620, 640, 610, 680, 700] },
          { name: '網頁', values: [300, 320, 310, 290, 330, 350, 340, 360, 380, 370, 390, 410, 400, 430] },
          { name: '行動裝置', values: [150, 170, 160, 190, 200, 230, 220, 240, 260, 250, 280, 300, 310, 330] },
        ]}
      />
    </div>
  );
}
export const Default = { render: () => <D /> };
