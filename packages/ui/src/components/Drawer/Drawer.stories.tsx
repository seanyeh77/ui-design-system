import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Overlays/Drawer', component: UI.Drawer };

function D() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('叢集監控');
  const [dirty, setDirty] = React.useState(false);
  const close = () => {
    setOpen(false);
    setDirty(false);
  };
  return (
    <div style={{ padding: 20 }}>
      <UI.Button
        variant="secondary"
        onClick={() => {
          setName('叢集監控');
          setDirty(false);
          setOpen(true);
        }}
      >
        編輯專案
      </UI.Button>
      <UI.Drawer
        open={open}
        onClose={close}
        title="編輯專案"
        dirty={dirty}
        actions={
          <>
            <UI.Button variant="secondary" onClick={close}>
              取消
            </UI.Button>
            <UI.Button variant="primary" onClick={close}>
              儲存
            </UI.Button>
          </>
        }
      >
        <UI.TextField
          label="名稱"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setDirty(true);
          }}
        />
        <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>修改名稱後關閉，會先確認是否放棄變更。</div>
      </UI.Drawer>
    </div>
  );
}
export const Default = { render: () => <D /> };
