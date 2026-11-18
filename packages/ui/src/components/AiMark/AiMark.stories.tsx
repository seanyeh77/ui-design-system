import * as UI from '../../index';

export default { title: 'Data/AiMark', component: UI.AiMark };

export const Default = {
  render: () => (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0 }}>
        <UI.AiMark />
        這個函式在每次路由表變動時重新建立連線，所以第 540 行的呼叫次數會隨鄰居數增加。
      </p>
      <UI.Markdown>{'[AI](ai:) 在 Markdown 裡寫 `[AI](ai:)`。\n\n- [AI](ai:) 清單項目的開頭也可以。\n- 沒有標記的項目是人寫的。'}</UI.Markdown>
    </div>
  ),
};
