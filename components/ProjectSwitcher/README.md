# ProjectSwitcher

頂部列右邊的專案狀態：現在看的是哪個專案、資料是不是即時的，點了可以切換專案或環境。

- 外框 Chip：高度 36 px，`line-strong` 外框，`radius-md`；內容是狀態圓點、「專案 · 狀態」，右邊下拉箭頭。
- 圓點：`live` 即時（`success`）、`stale` 已過期（`warning`）、`offline` 離線（`neutral-500`）。狀態文字可以用 `statusLabel` 改寫。
- 點了打開清單：每個選項是名稱加說明（例如環境），目前的選項是 `accent-soft` 底加勾；最下方可以放 `footer`，例如「所有資料來源設定」連結。點外面或按 Esc 關閉。
- 沒有 `options` 或 `onChange` 時只是顯示狀態，不能點。

```js
h(UI.ProjectSwitcher, {
  project: 'ibtrace', status: 'live', value: env, onChange: setEnv,
  options: [
    { id: 'ib-build', label: 'ibtrace', detail: 'build 環境' },
    { id: 'ib-rt', label: 'ibtrace', detail: 'runtime 環境' }
  ],
  footer: h('a', { href: '/settings/sources' }, '所有資料來源設定')
})
```
