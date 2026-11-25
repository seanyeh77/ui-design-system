import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Pages/Workbench', component: UI.Workbench, parameters: { layout: 'fullscreen' } };

const CODE = `class VirtualRouter:
    def _sync_as(self):
        for peer in self.peers:
            try:
                self.routes.update(peer.fetch())
            except Exception:
                pass

    def _monitor_loop(self):
        while True:
            self._sync_as()
            time.sleep(5)`;

const TREE: UI.TreeNode[] = [
  {
    id: 'harness',
    name: 'harness',
    icon: 'folder',
    children: [
      {
        id: 'ctl',
        name: 'controller.py',
        icon: 'file',
        mark: { label: '有值得注意的地方' },
        children: [
          { id: 'sync', name: '_sync_as', icon: 'function', mark: { label: '有值得注意的地方' } },
          { id: 'mon', name: '_monitor_loop', icon: 'function' },
        ],
      },
      { id: 'topo', name: 'topology.py', icon: 'file' },
    ],
  },
  { id: 'src', name: 'src', icon: 'folder', children: [{ id: 'child', name: 'child.c', icon: 'file' }] },
];

// A panel's list: a bare compact TreeList (the system's list rows), not a page-styled <ul>.
const list = (label: string, rows: string[]) => (
  <UI.TreeList kind="plain" density="compact" bare label={label} items={rows.map((r, i) => ({ id: String(i), name: r }))} />
);
const VIEWS: UI.WorkbenchView[] = [
  { id: 'outline', title: '大綱', render: () => list('大綱', ['VirtualRouter', '_sync_as', '_monitor_loop']) },
  { id: 'refs', title: '參考', render: () => list('參考', ['topology.py:31 建立 VirtualRouter']) },
  { id: 'problems', title: '問題', attention: true, render: () => list('問題', ['controller.py:44 例外被吞掉，沒有記錄。']) },
  { id: 'output', title: '輸出', render: () => list('輸出', ['已讀入 42 個檔案、318 個函式']) },
];

function Explorer({ sel, onSel }: { sel: string; onSel: (id: string) => void }) {
  const wb = UI.useWorkbench();
  return (
    <UI.TreeList
      kind="plain"
      density="compact"
      bare
      label="檔案"
      items={TREE}
      defaultOpen={['harness', 'ctl']}
      value={sel}
      onChange={(id, n) => {
        onSel(id);
        if (!n.children) wb.explorerPicked();
      }}
    />
  );
}
function Actions() {
  const wb = UI.useWorkbench();
  return (
    <>
      <UI.IconButton variant="quiet" icon="magnifying-glass" label="搜尋" />
      <UI.IconButton variant="quiet" icon="question" label="說明" />
      <UI.IconButton variant="quiet" icon="arrow-u-up-left" label="還原預設版面" onClick={wb.resetLayout} />
    </>
  );
}

function Demo() {
  const [sel, setSel] = React.useState('sync');
  const [filter, setFilter] = React.useState('');
  return (
    <div style={{ height: '100vh' }}>
      <UI.Workbench
        storageKey="story"
        brand={{ mark: <span style={{ display: 'block', width: 20, height: 20, borderRadius: 5, background: 'var(--accent)' }} />, name: 'app', href: '#' }}
        crumbs={[{ label: 'harness' }, { label: 'controller.py' }, { label: 'VirtualRouter._sync_as' }]}
        actions={<Actions />}
        explorerFilter={{ value: filter, onChange: setFilter, label: '篩選檔案與函式' }}
        mainBar={<UI.IconButton variant="quiet" icon="arrow-square-out" label="用 VS Code 開啟" />}
        explorer={<Explorer sel={sel} onSel={setSel} />}
        explorerFoot={<UI.Button icon="gear">設定</UI.Button>}
        views={VIEWS}
        defaultLayout={{ side: ['outline', 'refs'], panel: ['problems', 'output'] }}
      >
        <div style={{ padding: 16 }}>
          <UI.CodeView code={CODE} file="harness/controller.py" start={40} target={41} header="float" copy />
        </div>
      </UI.Workbench>
    </div>
  );
}

export const Default = { render: () => <Demo /> };
