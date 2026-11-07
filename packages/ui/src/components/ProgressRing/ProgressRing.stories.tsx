import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/ProgressRing', component: UI.ProgressRing };

function D() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
      <UI.ProgressRing value={72} label="本月目標達成率" />
      <div>
        <div style={{ fontWeight: 600 }}>本月目標達成率</div>
        <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>72 / 100 個專案</div>
      </div>
    </div>
  );
}
export const Default = { render: () => <D /> };
