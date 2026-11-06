import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Overlays/Tooltip', component: UI.Tooltip };

function D() {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '48px 20px 20px' }}>
      <UI.IconButton label="重新整理" icon={'refresh-cw'} />
      <UI.IconButton label="匯出" icon={'download-simple'} />
      <UI.Tooltip label="只有管理員可以封存">
        <UI.Button variant="secondary">封存</UI.Button>
      </UI.Tooltip>
    </div>
  );
}
export const Default = { render: () => <D /> };
