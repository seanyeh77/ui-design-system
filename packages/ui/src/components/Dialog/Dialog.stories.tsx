import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Overlays/Dialog', component: UI.Dialog };

export const Default = {
  render: () => (
    <div style={{ padding: 20 }}>
      <UI.Dialog
        title="刪除這個專案？"
        modal={false}
        onClose={function () {}}
        actions={React.createElement(
          React.Fragment,
          null,
          <UI.Button>取消</UI.Button>,
          <UI.Button variant="danger" confirmed>
            刪除
          </UI.Button>,
        )}
      >
        專案內的 12 個任務會一起刪除，這個動作無法復原。
      </UI.Dialog>
    </div>
  ),
};
