# ProjectSwitcher

頂部列右邊的專案狀態：現在看的是哪個專案、資料是不是即時的，點了可以切換專案或環境。

- 外框 Chip：高度 40 px，和按鈕、輸入框一致，`line-strong` 外框，`radius-md`；內容是狀態圓點、「專案 · 狀態」，右邊下拉箭頭。
- 圓點（10 px）的顏色和形狀都表示狀態，不只靠顏色：`live` 即時是實心圓（`success`）、`stale` 已過期是空心圓（`warning`）、`offline` 離線是加斜線的空心圓（`neutral-500`）。狀態文字可以用 `statusLabel` 改寫。
- 專案名稱和狀態分開排：寬度不夠時先截斷狀態，名稱最後才用「…」截斷。手機（小於 600 px）只寫名稱，狀態只用圓點表示；完整的「專案 · 狀態」在按鈕的 `aria-label` 和 `title`（滑過時顯示）。`statusLabel` 仍可以寫長一點（例如「快照 a085bc3」），手機上不會擠掉名稱。
- 點了打開清單：每個選項是名稱加說明（例如環境），目前的選項是 `accent-soft` 底加勾；最下方可以放 `footer`，例如「所有資料來源設定」連結。點外面或按 Esc 關閉。
- 沒有 `options` 或 `onChange` 時只是顯示狀態，不能點。

```js
h(UI.ProjectSwitcher, {
  project: 'ibtrace',
  status: 'live',
  value: env,
  onChange: setEnv,
  options: [
    { id: 'ib-build', label: 'ibtrace', detail: 'build 環境' },
    { id: 'ib-rt', label: 'ibtrace', detail: 'runtime 環境' },
  ],
  footer: h('a', { href: '/settings/sources' }, '所有資料來源設定'),
});
```
