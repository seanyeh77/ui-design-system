---
'@seanyeh77/ui': patch
---

codemap lab3 試用回饋：

- CommandPalette：已經列出結果、還在載入更多時，清單下方多一行「搜尋中」，頁面文字裡就看得出結果還不是最後的。
- TreeList：第 5 層以後的「L5」標記滑過時顯示「第 5 層」；補測試：有 `loadChildren` 時還沒展開過、標了 `hasChildren` 的節點是 `aria-expanded="false"`，ArrowRight 展開後 ArrowDown 進到第一個子節點。
- Switch README：要讓點文字也能切換，把文字和開關包在同一個 `<label>` 裡。
