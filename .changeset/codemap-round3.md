---
'@seanyeh77/ui': minor
---

- Tour：Tab 和 Shift + Tab 只在卡片的按鈕之間循環，不會跑到頁面上；Escape 關閉後焦點回到開啟前的元素。
- TreeList、Tabs、RadioGroup：按住 Alt、⌘ 或 Ctrl 的方向鍵留給瀏覽器（Alt + ← 回上一頁）。
- TopBar：觸控裝置不顯示 Ctrl K 提示；Mac 判斷先看 `navigator.userAgentData`。
- 新增 `UI.format.fraction` 和 `UI.format.fractionLabel`：畫面上「6 / 6 筆」，螢幕閱讀器念「6 筆中的 6 筆」。DataTable 的筆數和 TextArea 的字數改用它。
- DataTable：有長文字欄位時，每列左邊有展開箭頭，展開後在列下方列出長文字的全文；觸控裝置不再用滑過的 Tooltip（點一下會一直留在畫面上）。
- `focusMain()`：標題不畫焦點框；鍵盤操作後標題左邊有 3 px 強調色條，滑鼠或觸控時不顯示。
- TreeList：標籤的文字念在名稱裡，新增 `ariaLabel`；點有子項目的列（或按 Enter）同時展開或收合。
- LayerGraph：共用項目的「N 個項目使用，共 M 次」也算其他共用項目的使用，和清單檢視一致。

