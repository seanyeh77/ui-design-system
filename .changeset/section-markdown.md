---
'@seanyeh77/ui': minor
---

可收合段落、Markdown 與 DetailList 寬面板：

- 新元件 `Section`：可收合的段落，標題 20 px、右邊一行摘要、段落之間一條線、260 ms；`defaultOpen` 或 `open`＋`onOpenChange`、`id` 錨點自動展開、`lazy`、`storageKey`。預設收合的內容留在頁面上，頁內搜尋找到時自動展開。
- 新元件 `SectionGroup`：一組 Section，上方有帶圖示的「全部展開」「全部收合」。
- 新元件 `Markdown`：段落、標題（`#` 顯示成 h4）、粗體斜體、行內程式碼、程式碼區塊（CodeView）、連結、清單、引用、表格、水平線；不執行 HTML，連結只允許 http、https、mailto 與相對路徑；`linkHref`、`onLink`、`refHref`、`onRef`、`inline`、`size="small"`。
- CodeView：新的選填 `copy`，標題列右邊的複製小圖示；`onCopy`、`onCopyError`。
- DetailList：新的選填 `labelWidth`（`'auto'` 或 px）與 `labelSize`（`'small'`、`'body'`）。
- 圖示：新增 `arrows-out-line-vertical`、`arrows-in-line-vertical`。
