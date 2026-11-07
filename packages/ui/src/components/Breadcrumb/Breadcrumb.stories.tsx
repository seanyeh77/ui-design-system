import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Navigation/Breadcrumb', component: UI.Breadcrumb };

export const Default = {
  render: () => (
    <div className="ui-row">
      <UI.Breadcrumb items={[{ label: '首頁', href: '#' }, { label: '專案', href: '#' }, { label: '叢集監控' }]} />
    </div>
  ),
};
