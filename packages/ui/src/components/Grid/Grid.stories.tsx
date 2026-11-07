import * as UI from '../../index';

export default { title: 'Pages/Grid', component: UI.Grid, parameters: { layout: 'fullscreen' } };

export const Default = {
  render: () => (
    <div style={{ padding: 24 }}>
      <UI.Page>
        <UI.Grid columns={4}>
          <UI.KpiCard label="使用者" value={1284} unit="人" />
          <UI.KpiCard label="轉換率" value={3.4} format="percent" unit="%" />
          <UI.KpiCard label="錯誤率" value={0.8} format="percent" unit="%" delta={0.2} deltaUnit="pt" good={false} />
          <UI.KpiCard label="費用" value={1280} format="money" />
        </UI.Grid>
        <UI.Card title="說明">區塊之間 32 px，卡片之間 24 px。</UI.Card>
      </UI.Page>
    </div>
  ),
};
