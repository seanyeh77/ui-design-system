import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Actions/IconButton', component: UI.IconButton };

export const Default = {
  render: () => (
    <div className="ui-row">
      <UI.IconButton label="設定" icon={'sliders-horizontal'} />
      <UI.IconButton label="關閉" icon={'x'} />
      <UI.IconButton label="收合側邊欄" icon={'panel-left-close'} />
    </div>
  ),
};
