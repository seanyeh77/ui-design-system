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
