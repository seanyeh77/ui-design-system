import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Pages/DangerZone', component: UI.DangerZone };

function D() {
  return (
    <div style={{ padding: 20 }}>
      <UI.DangerZone
        title="刪除帳號"
        description="刪除後，所有專案和資料都無法復原。"
        actionLabel="刪除帳號"
        confirm={{ title: '刪除帳號？', body: '所有專案和資料會一起刪除，無法復原。' }}
        onAction={() => {}}
      />
    </div>
  );
}
export const Default = { render: () => <D /> };
