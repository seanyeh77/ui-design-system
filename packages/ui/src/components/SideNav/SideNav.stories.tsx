import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Navigation/SideNav', component: UI.SideNav };

const I = {
  home: 'house',
  proj: 'folder',
  users: 'users',
  chart: 'chart-column',
  gauge: 'gauge',
  set: 'sliders-horizontal',
} as const;
function Demo() {
  const [val, setVal] = React.useState('home');
  const [col, setCol] = React.useState(false);
  return (
    <div style={{ height: 520, display: 'flex' }}>
      <UI.SideNav
        value={val}
        onChange={setVal}
        collapsed={col}
        onToggle={function () {
          setCol(!col);
        }}
        brand={React.createElement(
          React.Fragment,
          null,
          <span style={{ flex: '0 0 24px', width: 24, height: 24, borderRadius: 6, background: 'var(--accent)' }} />,
          col ? null : <span>[專案名稱]</span>,
        )}
        sections={[
          {
            items: [
              { id: 'home', label: '首頁', icon: I.home },
              {
                id: 'proj',
                label: '專案',
                icon: I.proj,
                children: [
                  { id: 'active', label: '進行中' },
                  { id: 'archived', label: '已封存' },
                ],
              },
              { id: 'users', label: '成員', icon: I.users },
            ],
          },
          {
            items: [
              { id: 'report', label: '報表', icon: I.chart },
              { id: 'usage', label: '用量', icon: I.gauge },
            ],
          },
          { items: [{ id: 'settings', label: '設定', icon: I.set }] },
        ]}
      />
    </div>
  );
}
export const Default = { render: () => <Demo /> };
