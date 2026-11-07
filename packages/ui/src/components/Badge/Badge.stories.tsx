import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Status/Badge', component: UI.Badge };

export const Default = {
  render: () => (
    <div className="ui-row">
      <UI.Badge status="draft" />
      <UI.Badge status="doing" />
      <UI.Badge status="review" />
      <UI.Badge status="done" />
      <UI.Badge status="fail" />
    </div>
  ),
};
