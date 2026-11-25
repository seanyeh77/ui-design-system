import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Appearance/ThemePicker', component: UI.ThemePicker };

function D() {
  const [v, setV] = React.useState<UI.ThemeSetting>('auto');
  return (
    <div style={{ padding: 20 }}>
      <UI.ThemePicker value={v} onChange={setV} />
    </div>
  );
}
export const Default = { render: () => <D /> };
