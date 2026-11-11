import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Layout/Section', component: UI.Section };

export const Group = {
  render: () => (
    <div style={{ maxWidth: 760 }}>
      <UI.SectionGroup>
        <UI.Section title="元件" summary="6 個元件、138 個函式" defaultOpen>
          <UI.DetailList
            labelWidth="auto"
            labelSize="body"
            items={[
              { label: 'src/libibtrace', value: '攔截 infiniband 呼叫，18 個函式' },
              { label: 'src/ibmon', value: '讀共享記憶體並顯示，91 個函式' },
            ]}
          />
        </UI.Section>
        <UI.Section title="進入與結束" summary="2 個進入點、1 個結束點" defaultOpen>
          <UI.Markdown>{'`main`（`src/cli/main.c:12`）與 `ibtrace_init`，由 **LD_PRELOAD** 載入。'}</UI.Markdown>
        </UI.Section>
        <UI.Section id="external" title="外部指令" summary="29 個指令、4 個 namespace、3 個沒有逾時" lazy>
          <p style={{ margin: 0 }}>ibv_post_send：14 個呼叫處</p>
        </UI.Section>
        <UI.Section title="文件摘錄" summary="README.md、AGENTS.md">
          <UI.Markdown>{'先跑 `make`，再用 **harness/run.sh** 啟動。'}</UI.Markdown>
        </UI.Section>
      </UI.SectionGroup>
    </div>
  ),
};
