# CodeView

有行號的程式碼檢視，用在詳細卡片的原始碼、檢查筆記的引用。

- 行號：灰色等寬數字靠右，沒有底色和分隔線。可以選取複製程式碼，不會連行號一起複製。
- 目標行（`target`，一行或 `[from, to]`）：淡強調色底，左側 3 px 強調色細條，行號變粗。有 `maxHeight` 時會自動捲到目標行。
- 太長的行自動換行，續行縮排 4 個字元寬，不用橫向捲動。
- 語法上色：關鍵字藍、常數與字串綠、註解灰色斜體，其他是文字顏色。語言看 `file` 的副檔名（c、h、cpp、js、ts、py、sh），或用 `language` 指定；`highlight={false}` 關掉。內建的上色只認這幾種語言；其他語言給 `tokenizer`，把每行切成 `[class, 文字]`（class 是 `is-keyword`、`is-constant`、`is-comment`、`is-string` 或空字串）。
- 手機上（寬度小於 600 px）只顯示目標行前後 2 行（`context`），下方「顯示全部 N 行」。
- 標題列：`file` 顯示路徑，給 `fileHref` 或 `onFile` 變成連結；右邊寫語言。沒有檔案時可以給 `title`。

```js
h(UI.CodeView, {
  file: 'src/libibtrace/hooks/ops.c', fileHref: '#/file/ops.c',
  code: source, start: 70, target: 74, maxHeight: '420px'
})
```
