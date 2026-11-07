import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Overlays/Tour', component: UI.Tour };

const card = { background: 'var(--surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: 16, marginBottom: 12, fontSize: 15 };
function App() {
  const [open, setOpen] = React.useState(true);
  return (
    <div>
      <UI.TopBar title="流程" onSearch={() => {}} />
      <div style={{ padding: 16, maxWidth: 560 }}>
        <section data-tour="tree" style={card}>
          <strong>trace_post_send</strong>
          <div style={{ color: 'var(--ink-muted)', fontSize: 14 }}>呼叫 3 個函式</div>
        </section>
        <section data-tour="note" style={card}>
          檢查筆記：1 個錯誤
        </section>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>
          <button
            type="button"
            className="ui-link-btn"
            onClick={() => {
              setOpen(true);
            }}
          >
            重看導覽
          </button>
        </p>
      </div>
      <UI.Tour
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        steps={[
          { target: 'search', title: '搜尋', text: '搜尋函式、檔案、元件與環境變數。快捷鍵 Ctrl K。' },
          { target: 'tree', title: '流程樹', text: '名稱旁的標籤是關係的來源，點選問號查看依據。' },
          { target: 'note', title: '檢查筆記', text: '錯誤的位置附有修正建議，可直接複製。' },
        ]}
      />
    </div>
  );
}
export const Default = { render: () => <App /> };

// A target taller than the window (like a notes panel that fills the page): the card sits inside it, at the bottom.
function Tall() {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ padding: 16 }}>
      <section data-tour="panel" style={{ ...card, height: '150vh', boxSizing: 'border-box' }}>
        檢查筆記
      </section>
      <UI.Tour open={open} onClose={() => setOpen(false)} steps={[{ target: 'panel', title: '檢查筆記', text: '錯誤的位置附有修正建議，可直接複製。' }]} />
    </div>
  );
}
export const TallTarget = { render: () => <Tall /> };

// A target almost as tall as the window, under the top bar (one card filling the page): neither side has room,
// so the card sits inside it at the bottom of the window.
function NearlyFull() {
  const [open, setOpen] = React.useState(true);
  return (
    <div>
      <UI.TopBar title="檢查筆記" onSearch={() => {}} />
      <div style={{ padding: 16 }}>
        <section data-tour="notes" style={{ ...card, height: 'calc(100vh - 56px - 48px)', boxSizing: 'border-box', marginBottom: 0 }}>
          檢查筆記
        </section>
      </div>
      <UI.Tour
        open={open}
        onClose={() => setOpen(false)}
        steps={[
          { target: 'search', title: '搜尋', text: '搜尋函式、檔案、元件與環境變數。快捷鍵 Ctrl K。' },
          { target: 'notes', title: '檢查筆記', text: '錯誤的位置附有修正建議，可直接複製。' },
        ]}
      />
    </div>
  );
}
export const NearlyFullTarget = { render: () => <NearlyFull /> };
