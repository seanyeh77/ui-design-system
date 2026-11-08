# CodeView

有行號的程式碼檢視，用在詳細卡片的原始碼、檢查筆記的引用。

- 行號：灰色等寬數字靠右，沒有底色和分隔線。可以選取複製程式碼，不會連行號一起複製。
- 目標行（`target`，一行或 `[from, to]`）：淡強調色底，左側 3 px 強調色細條，行號變粗。有 `maxHeight` 時會自動捲到目標行。
- 太長的行自動換行，續行縮排 4 個字元寬，縮排裡有一條 2 px 的灰色直線（`line-strong`），看得出是同一行的接續，不是下一行程式。優先在逗號、句點和左括號後面換行；`->`、`==`、`&&` 這類運算子不會從中間斷開。不用橫向捲動。
- 語法上色：關鍵字藍、常數與字串綠、註解灰色斜體，其他是文字顏色。語言看 `file` 的副檔名（c、h、cpp、js、ts、py、sh），或用 `language` 指定；`highlight={false}` 關掉。內建的上色只認這幾種語言；其他語言給 `tokenizer`，把每行切成 `[class, 文字]`（class 是 `is-keyword`、`is-constant`、`is-comment`、`is-string` 或空字串）。
- 手機上（寬度小於 600 px）只顯示目標行前後 2 行（`context`），下方「顯示全部 N 行」。
- 標題列：`file` 顯示路徑，給 `fileHref` 或 `onFile` 變成連結；右邊用次要文字色寫程式語言，是純文字不是按鈕，C 寫成「C 語言」（單一個「C」看起來像按鈕），螢幕閱讀器讀「程式語言：C 語言」。`languageLabel` 換掉這個字，`false` 不顯示。沒有檔案時可以給 `title`。
- 專案自己在 CodeView 旁加複製按鈕時，放在程式碼區塊外（例如卡片標題列），用有文字或圖示的按鈕，不要放在語言標示旁邊。

```js
h(UI.CodeView, {
  file: 'src/libibtrace/hooks/ops.c',
  fileHref: '#/file/ops.c',
  code: source,
  start: 70,
  target: 74,
  maxHeight: '420px',
});
```

## 無障礙

- 程式碼區塊叫「程式碼」；每一行是一個清單項目，螢幕閱讀器可以逐行讀，先念「第 62 行」再念程式碼。行號只給眼睛看，「第 62 行」也不會被選取或複製。
- 目標行有 `aria-current="location"`。`ref` 的 `focusTarget()` 把焦點移到目標行，例如從檢查筆記點「看這一行」後。
