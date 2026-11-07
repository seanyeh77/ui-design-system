import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Navigation/MobileTabBar', component: UI.MobileTabBar };

const I = {
  home: 'house',
  proj: 'folder',
  users: 'users',
  chart: 'chart-column',
  gauge: 'gauge',
  set: 'sliders-horizontal',
} as const;
function Demo() {
  const [val, setVal] = React.useState('proj');
  return (
    <div style={{ maxWidth: 390 }}>
      <UI.MobileTabBar
        value={val}
        onChange={setVal}
        items={[
          { id: 'home', label: '首頁', icon: I.home },
          { id: 'proj', label: '專案', icon: I.proj },
          { id: 'report', label: '報表', icon: I.chart },
          { id: 'settings', label: '設定', icon: I.set },
        ]}
      />
    </div>
  );
}
export const Default = { render: () => <Demo /> };
