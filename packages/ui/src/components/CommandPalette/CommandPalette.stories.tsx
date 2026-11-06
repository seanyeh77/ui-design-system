import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Overlays/CommandPalette', component: UI.CommandPalette };

const ITEMS = [
  { id: 1, kind: '函式', label: 'trace_post_send', code: true, detail: '`src/…/hooks/ops.c:55`' },
  { id: 2, kind: '函式', label: 'ibv_post_send', code: true, detail: 'libibverbs.so.1（外部）' },
  { id: 3, kind: '檔案', label: 'src/libibtrace/hooks/post.h', code: true, detail: '12 個函式' },
  { id: 4, kind: '元件', label: 'libibtrace', code: true, detail: '3 個檔案' },
  { id: 5, kind: '環境變數', label: 'IBTRACE_POST_LOG', code: true, detail: '在 `env.c:31` 讀取' },
  { id: 6, kind: '頁面', label: '影響範圍', detail: '改一個函式會影響誰' },
];
function App() {
  const [open, setOpen] = React.useState(true);
  const [picked, setPicked] = React.useState('');
  return (
    <div>
      <UI.TopBar
        title="流程"
        onSearch={() => {
          setOpen(true);
        }}
      />
      <p style={{ padding: '0 24px', color: 'var(--ink-muted)', fontSize: 14 }}>{picked ? '打開了 ' + picked : '按 Ctrl K 或頂部列的搜尋打開。'}</p>
      <UI.CommandPalette
        open={open}
        onOpenChange={setOpen}
        items={ITEMS}
        recent={ITEMS.slice(0, 2)}
        defaultQuery="post"
        placeholder="搜尋函式、檔案、元件"
        onSelect={(it) => {
          setPicked(it.label);
        }}
      />
    </div>
  );
}
export const Default = { render: () => <App /> };
