# ProjectSwitcher

## 用法

頂部列右邊的專案狀態：現在看的是哪個專案、資料是不是即時的，點了可以切換專案或環境。

```tsx
<ProjectSwitcher
  project="web-app"
  status="live"
  value={env}
  onChange={setEnv}
  options={[
    { id: 'web-build', label: 'web-app', detail: 'build 環境' },
    { id: 'web-rt', label: 'web-app', detail: 'runtime 環境' },
  ]}
  footer={<Link href="/settings/sources">所有資料來源設定</Link>}
/>
```

- `status`：`live` 即時、`stale` 已過期、`offline` 離線；用 Badge 的圓圈表示，顏色和形狀都不同。狀態文字可以用 `statusLabel` 改寫。
- 沒有 `options` 或 `onChange` 時只是顯示狀態，不能點。

## 細節

- 外框 Chip：高度 40 px，和按鈕、輸入框一致，`line-strong` 外框，`radius-md`；內容是狀態圓圈、「專案 · 狀態」，右邊下拉箭頭。名稱 `ink` 半粗；狀態文字 `ink-muted`，`stale` 用 `warning-text` 加粗。
- 圓圈（Badge，15 px）：`live` 是實心圓（Badge `online`，`success-text`）、`stale` 是空心圓加 !（`tone="warning"`）、`offline` 是加斜線的空心圓（Badge `offline`，`ink-muted`）；用文字色，在頂部列上至少 3:1。
- 專案名稱和狀態分開排：寬度不夠時狀態文字整段拿掉（不會截成半個字），之後名稱才用一個「…」截斷；頂部列的頁面標題不先縮。手機（小於 600 px）只寫名稱，狀態只用圓圈表示；完整的「專案 · 狀態」在按鈕的 `aria-label` 和 `title`（滑過時顯示）。`statusLabel` 仍可以寫長一點（例如「快照 a085bc3」），手機上不會擠掉名稱。
- 點了打開清單：每個選項是名稱加說明（例如環境），目前的選項是 `accent-soft` 底加勾；最下方可以放 `footer`，例如「所有資料來源設定」連結。點外面或按 Esc 關閉。
