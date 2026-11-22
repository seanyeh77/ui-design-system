# CodeView

## 用法

有行號的程式碼檢視，用在詳細卡片的原始碼、檢查筆記的引用、Workbench 的主畫面。句子裡的一小段程式碼用 InlineCode。

```tsx
<CodeView file="src/server/hooks/ops.c" fileHref="#/file/ops.c" code={source} start={70} target={74} maxHeight="420px" copy />
```

- `target`（一行或 `[from, to]`）標出目標行；有 `maxHeight` 時自動捲到目標行。
- 外層已經寫出檔名時（例如 Workbench 的麵包屑）用 `header="float"`。
- 程式碼裡的名稱連結用 `links`（按住 Ctrl 或 ⌘ 才可點）；註解和字串裡的路徑用 `refHref`／`onRef`。
- 太長的行自動換行，不橫向捲動；手機上只顯示目標行前後 2 行。
- 內建上色認得 c、h、cpp、js、ts、py、sh；其他語言給 `tokenizer`。

## 細節

- 行號：灰色等寬數字靠右，沒有底色和分隔線；左邊留 12 px（和標題列的檔名對齊），和程式碼隔 16 px。可以選取複製程式碼，不會連行號一起複製。`lineNumbers={false}` 不顯示行號，給沒有人會引用行號的短片段用；螢幕閱讀器仍念「第 n 行」。
- 目標行（`target`，一行或 `[from, to]`）：淡強調色底，左側 3 px 強調色細條，行號變粗。有 `maxHeight` 時會自動捲到目標行。
- 太長的行自動換行，續行縮排 4 個字元寬，縮排裡有一條 2 px 的灰色直線（`line-strong`），看得出是同一行的接續，不是下一行程式。優先在逗號、句點和左括號後面換行；`->`、`==`、`&&` 這類運算子不會從中間斷開。不用橫向捲動。
- 語法上色低調：關鍵字藍（`code-keyword`）、常數與字串綠（`code-constant`）、註解灰色斜體，其他是文字顏色。語言看 `file` 的副檔名（c、h、cpp、js、ts、py、sh），或用 `language` 指定；`highlight={false}` 關掉。內建的上色只認這幾種語言；其他語言給 `tokenizer`，把每行切成 `[class, 文字]`（class 是 `is-keyword`、`is-constant`、`is-comment`、`is-string` 或空字串）。
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

## 讀者在哪一行（onLine）

`onLine(line, how)`：讀者點一行（`how` 是 `'click'`）或用鍵盤移到一行（`'key'`：↑ ↓、Home、End、PageUp、PageDown、[ ]）時呼叫。拖曳選取文字不算移動，放開時有選取的文字就不呼叫；點名稱連結（不按 Ctrl 或 ⌘）算點那一行，點路徑或名詞不算。給了 `onLine`，沒有 `links` 時 ↑ ↓ 也一行一行移動。

```js
h(UI.CodeView, { file, code, target: line, onLine: function (n) { setLine(n); } });
```

選取與複製：

- `target` 改變或呼叫 `focusTarget()` 時，讀者若在程式碼裡選取了文字，選取保留：不搶焦點、不捲動。
- 複製選取的多行時，只有程式碼：不含行號、螢幕閱讀器用的「第 n 行」，折行也接回原本的一行。

## 暫時標示一行（peek）

`peek` 標出一行或一段，和 `target` 分開，兩者可以同時存在；例如滑鼠停在說明欄的一筆上時，標出它對應的那一行，或停在「定義」的一項上時，標出整個 `struct { … }`。不移動焦點、不影響選取；`null` 清除。

- 一行：`peek: 42`。
- 一段：`peek: { from: 42, to: 57 }`，頭尾兩行都包含在內（`from` 比 `to` 大時自動對調）。範圍內每一行都用同樣的外觀標示。

```js
h(UI.CodeView, { file, code, target: line, peek: hover ? { from: hover.start, to: hover.end } : null });
```

捲動規則（捲的是程式碼本身，或包住它、可以捲動的最近一層，例如 Workbench 的面板；都沒有時捲整頁）：

- 整段放得進畫面時，以最小的捲動量讓整段都看得見；已經都看得見時不捲動。
- 整段比畫面高時，把第一行捲到頂端，讓這段填滿畫面。

外觀：白底（`surface`）加左側 3 px `line-strong` 線，比目標行（`accent-soft` 底、強調色線）安靜；和目標行重疊的那一行以目標行的樣子為準。手機上只顯示目標附近幾行時，範圍外沒有畫出的行不標示，也不為它們捲動。

## 名詞說明（terms）

註解和字串裡讀者可能看不懂的詞，用 `terms` 加上說明：`{ term, title?, text, action? }`，和 `Term variant="inline"` 一樣畫灰色虛線。

- 只在註解和字串裡找，整個字、分大小寫：`cookie` 不算 `cookies`，也不算 `Cookie`。程式碼本身的名稱（識別字）永遠不標。中文詞前後接中文字照樣算。
- 預設每個詞只標檔案裡第一次出現的地方；`termsMark: 'all'` 每次都標。
- 同一個位置已經是名稱連結（`links`）或路徑連結時，連結優先，不標名詞。
- 滑鼠停在詞上 500 ms 出現說明小卡；手機上點一下從下方打開。
- 鍵盤：整個程式碼仍只有一個 Tab 停留點；← → 依程式碼順序停在連結和名詞上，停在名詞時按 Enter 打開說明，Esc 關閉、焦點留在詞上，再按一次 Esc 回到那一行。

```js
h(UI.CodeView, {
  file: 'server/session.py',
  code: source,
  terms: [{ term: 'cookie', text: '瀏覽器替網站保存的一小段文字，之後每次請求都會帶上。', action: { label: '看它出現的地方', onClick: showUses } }],
});
```

## 無障礙

- 程式碼區塊叫「程式碼」；每一行是一個清單項目，螢幕閱讀器可以逐行讀，先念「第 62 行」再念程式碼。行首有縮排時接著念「縮排 8 格」（tab 念成「1 個 tab」），因為螢幕閱讀器會略過行首空白，而 Python 這類語言靠縮排決定一行屬於哪個區塊。行號只給眼睛看，「第 62 行」也不會被選取或複製。
- 目標行有 `aria-current="location"`。`ref` 的 `focusTarget()` 把焦點移到目標行，例如從檢查筆記點「看這一行」後。
- 有名稱連結（`links`）時，整個程式碼只有一個 Tab 停留點，不論有幾個連結：↑ ↓ 一次移一行（焦點落在那一行），← → 在連結之間移動（跨行，註解和字串裡的路徑也算），Enter 開啟，Esc 從連結回到那一行、再按一次回到程式碼框。螢幕閱讀器念連結的 `label`。這些按鍵寫在 `aria-keyshortcuts`，畫面上平常不顯示（見下方「按鍵說明」）。沒有名稱連結時 ↑ ↓ 照舊是捲動。
- 鍵盤：焦點在程式碼裡時，Home／End 到第一行／最後一行，PageUp／PageDown 一次 20 行，焦點落在那一行，螢幕閱讀器念出行號和內容。給 `sections`（每段開頭的行號和名稱，例如每個函式）時，`[` `]` 跳到上一段／下一段，並念「函式 _run，第 88 行」。這些按鍵寫在 `aria-keyshortcuts`。

## 標頭（header）

- `true`（預設）：標頭一列，有檔名或 `title`、語言、複製按鈕（`copy`）和鍵盤按鈕。
- `'float'`：不佔一列。滑鼠移到程式碼上或焦點在裡面時，右上角浮出語言、複製按鈕和鍵盤按鈕，150 ms 淡入；觸控螢幕上一直顯示。外層已經寫出檔名時用，例如 Workbench 主畫面上方的麵包屑。
- `false`：什麼都不畫。
- 三種都照 `file` 的副檔名判斷語言；區塊的名稱（`aria-label`）仍是檔名。

```tsx
<CodeView code={code} file="harness/controller.py" header="float" copy />
```

## 按鍵說明

畫面上平常不顯示按鍵文字，要看的人自己打開：

- 點標頭（或浮動工具）上的鍵盤按鈕，或焦點在程式碼裡時按 `?`，彈出列出全部按鍵的小視窗。
- 按 Esc、點外面或再按一次 `?` 關掉；用 `?` 打開時，關掉後焦點回到程式碼。
- 螢幕閱讀器從 `aria-keyshortcuts` 得知可以按哪些鍵，裡面也有 `?`。
