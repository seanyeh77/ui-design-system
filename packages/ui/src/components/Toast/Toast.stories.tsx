import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Feedback/Toast', component: UI.Toast };

export const Default = {
  render: () => (
    <div className="ui-row">
      <UI.Toast actionLabel="復原">已儲存變更</UI.Toast>
    </div>
  ),
};
