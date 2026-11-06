import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Appearance/ThemePicker', component: UI.ThemePicker };

function D() {
  const [v, setV] = React.useState<UI.ThemeSetting>('auto');
  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>主題</div>
      <UI.ThemePicker value={v} onChange={setV} />
    </div>
  );
}
export const Default = { render: () => <D /> };
