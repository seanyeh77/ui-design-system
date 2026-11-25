import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/Tag', component: UI.Tag };

export const Default = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 500 }}>hook_of</span>
      <UI.Tag>編譯器</UI.Tag>
      <span style={{ marginLeft: 24, fontWeight: 500 }}>原本的 post_send</span>
      <UI.Tag>規則：經由指標</UI.Tag>
      <span style={{ marginLeft: 24, fontWeight: 500, color: 'var(--ink-muted)' }}>clock_gettime</span>
      <UI.Tag>外部</UI.Tag>
    </div>
  ),
};

export const Source = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 20, fontWeight: 700 }}>
      機房監控
      <UI.Tag icon="info">示範資料</UI.Tag>
      <span style={{ fontSize: 16, fontWeight: 400 }}>
        25.8 °C{' '}
        <UI.Tag icon="trend-up" tone="info">
          預測
        </UI.Tag>
      </span>
    </div>
  ),
};
