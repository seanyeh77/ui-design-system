import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Navigation/TopBar', component: UI.TopBar };

export const Default = {
  render: () => (
    <UI.TopBar title="叢集監控" onSearch={() => {}}>
      <span style={{ width: 36, height: 36, borderRadius: 99, background: 'var(--surface-sub)', border: '1px solid var(--line)' }} />
    </UI.TopBar>
  ),
};
