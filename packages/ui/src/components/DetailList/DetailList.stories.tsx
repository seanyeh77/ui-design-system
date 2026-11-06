import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/DetailList', component: UI.DetailList };

export const Default = {
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <UI.DetailList
        items={[
          { label: '定義', value: <UI.InlineCode href="#">src/libibtrace/hooks/ops.c:55</UI.InlineCode> },
          { label: '元件', value: 'src/libibtrace' },
          { label: '關係', value: '1 個 caller · 呼叫 4 個 repo 內的函式' },
          { label: '怎麼找到的', value: <UI.Tag>編譯器</UI.Tag> },
        ]}
      />
    </div>
  ),
};
