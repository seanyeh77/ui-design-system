import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Feedback/NotificationBell', component: UI.NotificationBell };

const base = [
  { id: 1, title: '節點 node-3 離線', body: '超過 5 分鐘沒有回應', time: '10 分鐘前', group: '今天' },
  { id: 2, title: '李小華 提到了你', body: '「部署腳本請幫忙看一下」', time: '1 小時前', group: '今天' },
  { id: 3, title: '備份完成', body: '共 128 GB', time: '3 小時前', group: '今天', read: true },
  { id: 4, title: '帳號整合 已審核通過', time: '昨天 18:20', group: '更早', read: true },
];
function D() {
  const s = React.useState(base);
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 20, minHeight: 420 }}>
      <UI.NotificationBell
        items={s[0]}
        onOpen={function (it) {
          s[1](
            s[0].map((x) => {
              return x.id === it.id ? Object.assign({}, x, { read: true }) : x;
            }),
          );
        }}
        onReadAll={function () {
          s[1](
            s[0].map((x) => {
              return Object.assign({}, x, { read: true });
            }),
          );
        }}
      />
    </div>
  );
}
export const Default = { render: () => <D /> };
