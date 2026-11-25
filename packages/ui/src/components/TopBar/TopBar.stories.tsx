import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Navigation/TopBar', component: UI.TopBar };

export const Default = {
  render: () => (
    <UI.TopBar title="叢集監控" onSearch={() => {}}>
      <UI.NotificationBell items={[]} />
      <UI.Menu icon="user" label="帳號" items={[{ label: '登出', icon: 'sign-out', onSelect: () => {} }]} />
    </UI.TopBar>
  ),
};
