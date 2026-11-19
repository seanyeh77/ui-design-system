---
'@seanyeh77/ui': minor
---

Term 新增 `variant="inline"`：句子裡的名詞畫灰色虛線，滑鼠停 500 ms 或鍵盤焦點時顯示說明卡，手機點一下從下方打開，螢幕閱讀器念「cookie，有說明」。CodeView 新增 `terms` 與 `termsMark`：只在註解和字串裡以整個字比對，預設每個檔案標第一次，名稱連結優先，← → 也會停在名詞上，Enter 打開說明。Markdown 新增 `terms` 與 `termsMark`（預設每個段落、清單項目或表格格子標第一次），也可以用 `[cookie](term:cookie)` 指定某一處。匯出 `TermDef`、`TermsMark` 型別。
