# CodeView

有行號的程式碼檢視，用在詳細卡片的原始碼、檢查筆記的引用。

- 行號：灰色等寬數字靠右，沒有底色和分隔線；左邊留 12 px（和標題列的檔名對齊），和程式碼隔 16 px。可以選取複製程式碼，不會連行號一起複製。`lineNumbers={false}` 不顯示行號，給沒有人會引用行號的短片段用；螢幕閱讀器仍念「第 n 行」。
- 目標行（`target`，一行或 `[from, to]`）：淡強調色底，左側 3 px 強調色細條，行號變粗。有 `maxHeight` 時會自動捲到目標行。
- 太長的行自動換行，續行縮排 4 個字元寬，縮排裡有一條 2 px 的灰色直線（`line-strong`），看得出是同一行的接續，不是下一行程式。優先在逗號、句點和左括號後面換行；`->`、`==`、`&&` 這類運算子不會從中間斷開。不用橫向捲動。
- 語法上色：關鍵字藍、常數與字串綠、註解灰色斜體，其他是文字顏色。語言看 `file` 的副檔名（c、h、cpp、js、ts、py、sh），或用 `language` 指定；`highlight={false}` 關掉。內建的上色只認這幾種語言；其他語言給 `tokenizer`，把每行切成 `[class, 文字]`（class 是 `is-keyword`、`is-constant`、`is-comment`、`is-string` 或空字串）。
- 手機上（寬度小於 600 px）只顯示目標行前後 2 行（`context`），下方「顯示全部 N 行」。
- 標題列：`file` 顯示路徑，給 `fileHref` 或 `onFile` 變成連結；右邊用次要文字色寫程式語言，是純文字不是按鈕，C 寫成「C 語言」（單一個「C」看起來像按鈕），螢幕閱讀器讀「程式語言：C 語言」。`languageLabel` 換掉這個字，`false` 不顯示。沒有檔案時可以給 `title`。
- 註解和字串裡的路徑可以變成連結：給 `refHref: (path) => 連結`（回傳 `undefined` 的不變）或 `onRef: (path, e) => …`，和 `CodeText` 一樣。算路徑的：有資料夾和副檔名的（`docs/design/ring-overrun.md`）、檔名加行號（`ring.c:42`、`src/app.c:86-90`）；程式碼本身和只有檔名的（`printf.h`）不算。有連結時是 `<a>`，只有 `onRef` 時是按鈕；強調文字色、底線。
- 程式碼裡的名稱可以是連結：給 `links`，每個是 `{ line, text, col?, href?, label? }`，例如 `{ line: 58, text: 'runtime.deploy', href: '#/fn/runtime.deploy', label: 'runtime.deploy，定義在 harness/runtime.py:591' }`。
  - 外觀：保留語法色，加淡色虛線底線（目標行上不透明）。按住 Ctrl 或 ⌘ 時，滑鼠移上去變成強調色實線、手形游標，點了才開啟；一般點擊只選取文字，和編輯器一樣。觸控螢幕沒有 Ctrl，點一下就開啟。Shift＋點擊和中鍵照瀏覽器在新視窗或分頁開 `href`。
  - 開啟：有 `onLink(link, e)` 時呼叫它（收到你傳進來的同一個物件，可以多帶自己的欄位，例如 `id`），取消預設的換頁；沒有時在同一個分頁開 `href`。
  - 比對：給 `col`（從 1 開始、以字元計）時以那個位置為準；沒有時找這一行第一個完整的 `text`，整個帶點的名稱，不只比對最後一段（`rt.deploy` 不算 `runtime.deploy`）。對不上的連結不加，開發模式下 console 警告原因。同一行同一個名稱出現兩次時，第二個要給 `col`。Python 的 ast 給的是從 0 開始的 UTF-8 位元組位置，TypeScript 給從 0 開始的 UTF-16 位置，要先換算。
  - 預覽：給 `preview: (link) => 內容`，滑鼠或鍵盤焦點停在名稱上 500 ms，名稱下方出現小卡片，例如名稱、定義位置（連結）、第一行說明。滑鼠可以移進卡片點裡面的連結，Esc 關閉。有 `preview` 時 `label` 不當原生 tooltip。
  - 名稱連結折行時兩段都有底線，是同一個連結。註解和字串裡的路徑連結維持原樣。

```js
h(UI.CodeView, {
  file: 'harness/lab3.py',
  code: source,
  start: 50,
  target: 58,
  links: calls.map((c) => ({ line: c.line, col: c.col, text: c.text, href: '#/fn/' + c.target, label: c.text + '，定義在 ' + c.def, id: c.target })),
  onLink: (link) => openFunction(link.id),
  preview: (link) => h('div', null, h('strong', null, link.text), h('div', null, '定義在 ' + link.def)),
});
```

- 複製：`copy` 在標題列最右邊（語言標示的右側）放一個複製的小圖示（32 px，手機 48 px），複製整段程式碼後 2 秒變成勾，提示「已複製」；沒有 `file`、`title` 時也會顯示標題列。`onCopy`、`onCopyError` 接手結果，例如複製失敗時用 Toast 說明。預設不顯示；Markdown 的程式碼區塊預設顯示。

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

- 程式碼區塊叫「程式碼」；每一行是一個清單項目，螢幕閱讀器可以逐行讀，先念「第 62 行」再念程式碼。行首有縮排時接著念「縮排 8 格」（tab 念成「1 個 tab」），因為螢幕閱讀器會略過行首空白，而 Python 這類語言靠縮排決定一行屬於哪個區塊。行號只給眼睛看，「第 62 行」也不會被選取或複製。
- 目標行有 `aria-current="location"`。`ref` 的 `focusTarget()` 把焦點移到目標行，例如從檢查筆記點「看這一行」後。
- 有名稱連結（`links`）時，整個程式碼只有一個 Tab 停留點，不論有幾個連結：↑ ↓ 一次移一行（焦點落在那一行），← → 在連結之間移動（跨行，註解和字串裡的路徑也算），Enter 開啟，Esc 從連結回到那一行、再按一次回到程式碼框。螢幕閱讀器念連結的 `label`。這些按鍵也顯示在下方、寫在 `aria-keyshortcuts`。沒有名稱連結時 ↑ ↓ 照舊是捲動。
- 鍵盤：焦點在程式碼裡時，Home／End 到第一行／最後一行，PageUp／PageDown 一次 20 行，焦點落在那一行，螢幕閱讀器念出行號和內容。給 `sections`（每段開頭的行號和名稱，例如每個函式）時，`[` `]` 跳到上一段／下一段，並念「函式 _run，第 88 行」。這些按鍵在程式碼有焦點時顯示在下方，也寫在 `aria-keyshortcuts`。
