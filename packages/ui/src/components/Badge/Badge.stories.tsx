import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Status/Badge', component: UI.Badge };

const ALL: UI.BadgePreset[] = ['draft', 'doing', 'review', 'done', 'fail', 'closed', 'paused', 'online', 'offline'];

export const Default = {
  render: () => (
    <div className="ui-row">
      {ALL.map((s) => (
        <UI.Badge key={s} status={s} />
      ))}
    </div>
  ),
};

export const Tones = {
  render: () => (
    <UI.Card title="訂單狀態">
      <div className="ui-row" style={{ padding: 0 }}>
        <UI.Badge tone="neutral">待付款</UI.Badge>
        <UI.Badge tone="info">出貨中</UI.Badge>
        <UI.Badge tone="success">已付款</UI.Badge>
        <UI.Badge tone="warning">庫存不足</UI.Badge>
        <UI.Badge tone="danger">付款失敗</UI.Badge>
      </div>
    </UI.Card>
  ),
};
