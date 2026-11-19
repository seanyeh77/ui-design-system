import * as UI from '../../index';

export default { title: 'Data/AiMark', component: UI.AiMark };

export const Default = {
  render: () => (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0 }}>
        這個函式在每次路由表變動時重新建立連線，所以第 540 行的呼叫次數會隨鄰居數增加。
        <UI.AiMark />
      </p>
      <UI.Markdown>
        {
          '在 Markdown 裡寫 `[AI](ai:)`，標示畫在這一段的最後。[AI](ai:)\n\n- 清單項目也可以。[AI](ai:)\n- 由文字推得的寫 `[推測](ai:)`。[推測](ai:)\n- 沒有標示的項目來自程式碼。'
        }
      </UI.Markdown>
    </div>
  ),
};
