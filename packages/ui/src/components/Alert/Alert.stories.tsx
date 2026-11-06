import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Status/Alert', component: UI.Alert };

export const Default = {
  render: () => (
    <div className="ui-stack">
      <UI.Alert tone="info" title="有新版本" actionLabel="重新整理" onDismiss={function () {}}>
        重新整理後即可使用新功能。
      </UI.Alert>
      <UI.Alert tone="success" title="已儲存變更" onDismiss={function () {}}>
        所有成員都會看到更新。
      </UI.Alert>
      <UI.Alert tone="warning" title="空間即將用完" actionLabel="管理">
        目前已使用 92%。
      </UI.Alert>
      <UI.Alert tone="danger" title="連線失敗" actionLabel="重試">
        請檢查網路後再試一次。
      </UI.Alert>
    </div>
  ),
};
