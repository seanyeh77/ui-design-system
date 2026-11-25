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
        <UI.Grid columns={[2, 1]}>
          <UI.Page>
            <UI.Card title="主要內容">區塊之間 32 px，卡片之間 24 px。</UI.Card>
            <UI.Card title="同一欄的第二張">一欄裡的卡片包在 Page 裡，間距也是 24 px。</UI.Card>
          </UI.Page>
          <UI.Card title="側欄">2 比 1，寬度小於 960 px 時排在主要內容下方。</UI.Card>
        </UI.Grid>
      </UI.Page>
    </div>
  ),
};
