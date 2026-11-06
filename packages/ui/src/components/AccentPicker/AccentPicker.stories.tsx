import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Appearance/AccentPicker', component: UI.AccentPicker };

function D() {
  const v = React.useState('#2457d6');
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 700 }}>強調色</div>
      <UI.AccentPicker value={v[0]} onChange={v[1]} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ width: 16, height: 16, borderRadius: 4, background: v[0] }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{v[0]}</span>
      </div>
    </div>
  );
}
export const Default = { render: () => <D /> };
