import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/DetailList', component: UI.DetailList };

export const Default = {
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <UI.DetailList
        items={[
          { label: '定義', value: <UI.InlineCode>src/server/hooks/ops.c:55</UI.InlineCode>, href: '#def' },
          { label: '元件', value: 'src/server' },
          { label: '關係', value: '1 個 caller · 呼叫 4 個 repo 內的函式' },
          { label: '怎麼找到的', value: <UI.Tag>編譯器</UI.Tag> },
          { label: '規格', value: 'POSIX shm_open', href: 'https://pubs.opengroup.org/onlinepubs/9799919799/functions/shm_open.html', external: true },
        ]}
      />
    </div>
  ),
};
