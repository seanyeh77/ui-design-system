import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Overlays/Drawer', component: UI.Drawer };

function D() {
  const o = React.useState(false),
    n = React.useState('叢集監控'),
    d = React.useState(false);
  function close() {
    o[1](false);
    d[1](false);
  }
  return (
    <div style={{ padding: 20 }}>
      <UI.Button
        variant="secondary"
        onClick={function () {
          n[1]('叢集監控');
          d[1](false);
          o[1](true);
        }}
      >
        編輯專案
      </UI.Button>
      <UI.Drawer
        open={o[0]}
        onClose={close}
        title="編輯專案"
        dirty={d[0]}
        actions={[
          <UI.Button key="c" variant="secondary" onClick={close}>
            取消
          </UI.Button>,
          <UI.Button key="s" variant="primary" onClick={close}>
            儲存
          </UI.Button>,
        ]}
      >
        <UI.TextField
          label="名稱"
          required={true}
          value={n[0]}
          onChange={function (e) {
            n[1](e.target.value);
            d[1](true);
          }}
        />
        <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>改一下名稱再關閉，會先問要不要放棄變更。</div>
      </UI.Drawer>
    </div>
  );
}
export const Default = { render: () => <D /> };
