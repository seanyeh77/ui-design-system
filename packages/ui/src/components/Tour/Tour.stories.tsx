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

// Inside AppShell on a phone: steps 3 and 4 introduce a tall card and the bottom tabs. The card scrolls up under the
// top bar and the Tour card sits below it, above the tabs; for the tabs the Tour card sits just above them.
const NAV: UI.NavSection[] = [
  {
    items: [
      { id: 'home', label: '總覽', icon: 'house' },
      { id: 'graph', label: '架構', icon: 'share-network' },
      { id: 'notes', label: '檢查', icon: 'check-square' },
      { id: 'search', label: '搜尋', icon: 'magnifying-glass' },
    ],
  },
];
function InShell() {
  const [page, setPage] = React.useState('home');
  const [step, setStep] = React.useState(2);
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ height: '100vh' }}>
      <UI.AppShell nav={NAV} value={page} onNavigate={setPage} title="總覽">
        <section data-tour="errors" style={{ ...card, height: 120 }}>
          待處理的錯誤：<span className="ui-num">3</span> 個
        </section>
        <section data-tour="graph" style={{ ...card, height: 340 }}>
          架構
        </section>
        <section style={{ ...card, height: 220 }}>檢查筆記</section>
      </UI.AppShell>
      <UI.Tour
        open={open}
        step={step}
        onStepChange={setStep}
        onClose={() => setOpen(false)}
        steps={[
          { title: '歡迎', text: '這裡整理專案的架構和檢查結果。' },
          { target: 'errors', title: '待處理的錯誤', text: '需要修正的項目會先列在這裡。' },
          { target: 'graph', title: '架構', text: '各個元件的分層和呼叫關係；點方框或線可以看細節。' },
          { target: '.ui-tabbar', title: '底部分頁', text: '總覽、架構、檢查和搜尋都在這裡切換。' },
        ]}
      />
    </div>
  );
}
export const PhoneInShell = { render: () => <InShell /> };
