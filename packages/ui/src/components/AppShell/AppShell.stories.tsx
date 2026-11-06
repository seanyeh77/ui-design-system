import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Pages/AppShell', component: UI.AppShell, parameters: { layout: 'fullscreen' } };

function Demo() {
  const [page, setPage] = React.useState('home');
  return (
    <div style={{ height: 560 }}>
      <UI.AppShell
        nav={[
          {
            items: [
              { id: 'home', label: '總覽', icon: 'house' },
              { id: 'projects', label: '專案', icon: 'folder' },
              { id: 'reports', label: '報表', icon: 'chart-bar' },
            ],
          },
          { items: [{ id: 'settings', label: '設定', icon: 'gear' }] },
        ]}
        value={page}
        onNavigate={setPage}
        brand="專案中心"
        title="總覽"
        onSearch={() => {}}
      >
        <UI.Page>
          <UI.Grid columns={3}>
            <UI.KpiCard label="本月營收" value={12840000} format="money" delta={8.2} />
            <UI.KpiCard label="進行中專案" value={18} unit="個" />
            <UI.KpiCard label="平均回應時間" value={184} unit="ms" delta={-12.5} good />
          </UI.Grid>
        </UI.Page>
      </UI.AppShell>
    </div>
  );
}

export const Default = { render: () => <Demo /> };
