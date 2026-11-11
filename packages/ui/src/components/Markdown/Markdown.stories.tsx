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
