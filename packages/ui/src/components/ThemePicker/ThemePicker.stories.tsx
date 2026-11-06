import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Appearance/ThemePicker', component: UI.ThemePicker };

function D() {
  const v = React.useState<UI.ThemeSetting>('auto');
  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>主題</div>
      <UI.ThemePicker value={v[0]} onChange={v[1]} />
    </div>
  );
}
export const Default = { render: () => <D /> };
