import * as UI from '../../index';

export default { title: 'Feedback/Toast', component: UI.Toast };

export const Default = {
  render: () => (
    <div className="ui-stack">
      <div className="ui-row">
        <UI.Button onClick={() => UI.toast('已儲存變更')}>儲存</UI.Button>
        <UI.Button
          onClick={() => UI.toast('已刪除 3 筆', { action: { label: '復原', undo: true, onAction: () => UI.toast('已復原 3 筆', { tone: 'info' }) } })}
        >
          刪除
        </UI.Button>
      </div>
      <UI.Toast>已儲存變更</UI.Toast>
      <UI.Toast tone="danger">儲存失敗：網路中斷，請稍後再試</UI.Toast>
      <UI.Toaster />
    </div>
  ),
};
