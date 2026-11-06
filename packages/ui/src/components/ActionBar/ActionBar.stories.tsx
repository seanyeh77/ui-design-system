import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Actions/ActionBar', component: UI.ActionBar };

export const Default = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <UI.ActionBar actions={[{ label: '追流程', primary: true }, { label: '看影響' }, { label: '展開 macro' }]} />
      <div style={{ width: 360 }}>
        <UI.ActionBar actions={[{ label: '追流程', primary: true }, { label: '看影響' }, { label: '展開 macro' }]} />
      </div>
    </div>
  ),
};
