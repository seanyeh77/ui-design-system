import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/Markdown', component: UI.Markdown };

const readme = `# 執行方式

先跑 \`make\`，再用 **harness/run.sh** 啟動。評分方式見 [評分](docs/grading.md) 與 \`harness/oracle.py:126\`。

- 修改 \`controller.py\` 前先跑全部的測試
- 不要修改 \`harness/\` 底下的檔案

\`\`\`python
def flow_priority(flow, link):
    return 7 if flow.urgent else 0  # 越大越先送
\`\`\`

| 測資 | 筆數 |
|---|---|
| small | 12 |
| large | 480 |
`;

export const Document = {
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <UI.Markdown refHref={(r) => '#' + r} linkHref={(h) => '#' + h}>
        {readme}
      </UI.Markdown>
    </div>
  ),
};

export const Inline = {
  render: () => <UI.Markdown inline>{'先跑 `make`，再用 **harness/run.sh** 啟動。'}</UI.Markdown>,
};

const notes = `[AI](ai:) [\`VirtualRouter._sync_as\`](fn:harness/controller.py:VirtualRouter._sync_as) \`harness/controller.py:540\` 呼叫 [\`_monitor_loop\`](fn:harness/controller.py:_monitor_loop)，每 5 秒同步一次路由。

環境變數 \`IBTRACE_SHM\` 決定共用記憶體的名稱，見 [設定說明](fn:docs/config.md)。`;

export const NamesAndAiMark = {
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <UI.Markdown schemes={['fn']} linkHref={(h) => '#' + h} refHref={(r) => '#' + r}>
        {notes}
      </UI.Markdown>
    </div>
  ),
};

/** terms: words in plain text get an explanation (Term variant="inline"); [詞](term:詞) marks one explicitly. */
export const Terms = {
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <UI.Markdown
        terms={[
          { term: 'cookie', text: '瀏覽器替網站保存的一小段文字，之後每次請求都會帶上。' },
          { term: 'session', title: '工作階段', text: '伺服器記住同一位使用者的一段期間，靠 cookie 認出是誰。' },
        ]}
      >
        {'登入後伺服器寫入 cookie，之後每次請求都帶上這個 cookie。\n\n[工作階段](term:session) 過期時要重新登入。'}
      </UI.Markdown>
    </div>
  ),
};
