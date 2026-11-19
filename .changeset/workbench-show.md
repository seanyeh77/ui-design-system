---
'@seanyeh77/ui': minor
---

`Workbench` 新增 `useWorkbench().show(viewId)`：把某個分頁設成它那一邊目前的分頁並打開那一邊（窄螢幕疊上來、手機打開合併面板），不改變分頁位置。新增 `useWorkbench().layout`、`onLayoutChange` 讀取目前版面，以及 `ref`（`WorkbenchHandle`：`show`、`toggle`、`resetLayout`、`getLayout` 等）讓 Workbench 外面也能呼叫。
