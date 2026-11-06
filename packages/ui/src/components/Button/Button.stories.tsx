import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Actions/Button', component: UI.Button };

function Demo() {
  const [saving, set] = React.useState(false);
  function save() {
    set(true);
    setTimeout(() => {
      set(false);
    }, 1400);
  }
  return (
    <div className="ui-stack">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <UI.Button variant="primary" onClick={save} loading={saving}>
          {saving ? '儲存中' : '儲存'}
        </UI.Button>
        <UI.Button>取消</UI.Button>
        <UI.Button variant="danger" confirm={{ title: '刪除這個專案？', body: '專案內的 12 個任務會一起刪除，無法復原。' }}>
          刪除
        </UI.Button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <UI.Button variant="primary" disabled={true}>
          無法使用
        </UI.Button>
        <UI.Button disabled={true}>無法使用</UI.Button>
        <UI.Button variant="primary" icon={'plus'}>
          新增
        </UI.Button>
      </div>
    </div>
  );
}
export const Default = { render: () => <Demo /> };
