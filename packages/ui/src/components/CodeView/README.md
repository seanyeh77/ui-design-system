# CodeView

## 用法

有行號的程式碼檢視，用在詳細頁的原始碼、引用某幾行的說明、Workbench 的主畫面。句子裡的一小段程式碼用 InlineCode。

```tsx
<CodeView file="src/server/hooks/ops.c" fileHref="#/file/ops.c" code={source} start={70} target={74} maxHeight="420px" copy />
```

- `target`（一行或 `[from, to]`）標出目標行；有 `maxHeight` 時自動捲到目標行。
- 外層已經寫出檔名時（例如 Workbench 的麵包屑）用 `header="float"`。
- 程式碼裡的名稱連結用 `links`（按住 Ctrl 或 ⌘ 才可點）；註解和字串裡的路徑用 `refHref`／`onRef`。
- 太長的行自動換行，不橫向捲動；手機上只顯示目標行前後 2 行。
- 內建上色認得 c、h、cpp、js、ts、py、sh；其他語言給 `tokenizer`。

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

有 `maxHeight` 或在可捲動的面板裡時，會捲到讓整段看得見的位置（已經看得見時不捲）。

## 名詞說明（terms）

註解和字串裡讀者可能看不懂的詞，用 `terms` 加上說明：`{ term, title?, text, action? }`，和 `Term variant="inline"` 一樣畫灰色虛線。

- 只在註解和字串裡找，整個字、分大小寫：`cookie` 不算 `cookies`，也不算 `Cookie`。程式碼本身的名稱（識別字）永遠不標。中文詞前後接中文字照樣算。
- 預設每個詞只標檔案裡第一次出現的地方；`termsMark: 'all'` 每次都標。
- 同一個位置已經是名稱連結（`links`）或路徑連結時，連結優先，不標名詞。

```js
h(UI.CodeView, {
  file: 'server/session.py',
  code: source,
  terms: [{ term: 'cookie', text: '瀏覽器替網站保存的一小段文字，之後每次請求都會帶上。', action: { label: '看它出現的地方', onClick: showUses } }],
});
```

## 標頭（header）

- `true`（預設）：標頭一列，有檔名或 `title`、語言、複製按鈕（`copy`）和鍵盤按鈕。
- `'float'`：不佔一列，語言、複製按鈕和鍵盤按鈕浮在右上角（滑鼠移上去或有焦點時出現，觸控螢幕上一直顯示）。外層已經寫出檔名時用，例如 Workbench 主畫面上方的麵包屑。
- `false`：什麼都不畫。
- 三種都照 `file` 的副檔名判斷語言；區塊的名稱（`aria-label`）仍是檔名。

```tsx
<CodeView code={code} file="harness/controller.py" header="float" copy />
```

## 細節

- `lineNumbers={false}` 不顯示行號，給沒有人會引用行號的短片段用；螢幕閱讀器仍念「第 n 行」。複製時不會帶到行號。
- 語言看 `file` 的副檔名（c、h、cpp、js、ts、py、sh），或用 `language` 指定；`highlight={false}` 關掉上色。其他語言給 `tokenizer`，把每行切成 `[class, 文字]`（class 是 `is-keyword`、`is-constant`、`is-comment`、`is-string` 或空字串）。
- 手機上（寬度小於 600 px）只顯示目標行前後 `context` 行（預設 2），下方「顯示全部 N 行」。
- 標題列：`file` 顯示路徑，給 `fileHref` 或 `onFile` 變成連結；右邊是程式語言（純文字），`languageLabel` 換掉這個字，`false` 不顯示。沒有檔案時可以給 `title`。
- 註解和字串裡的路徑可以變成連結：給 `refHref: (path) => 連結`（回傳 `undefined` 的不變）或 `onRef: (path, e) => …`，和 `CodeText` 一樣。算路徑的：有資料夾和副檔名的（`docs/design/ring-overrun.md`）、檔名加行號（`ring.c:42`、`src/app.c:86-90`）；程式碼本身和只有檔名的（`printf.h`）不算。
- 程式碼裡的名稱可以是連結：給 `links`，每個是 `{ line, text, col?, href?, label? }`，例如 `{ line: 58, text: 'runtime.deploy', href: '#/fn/runtime.deploy', label: 'runtime.deploy，定義在 harness/runtime.py:591' }`。
  - 按住 Ctrl 或 ⌘ 點才開啟（和編輯器一樣，一般點擊只選取文字）；觸控螢幕點一下就開啟。
  - 開啟：有 `onLink(link, e)` 時呼叫它（收到你傳進來的同一個物件，可以多帶自己的欄位，例如 `id`），取消預設的換頁；沒有時在同一個分頁開 `href`。
  - 比對：給 `col`（從 1 開始、以字元計）時以那個位置為準；沒有時找這一行第一個完整的 `text`，整個帶點的名稱（`rt.deploy` 不算 `runtime.deploy`）。對不上的連結不加，開發模式下 console 警告原因。同一行同一個名稱出現兩次時，第二個要給 `col`。Python 的 ast 給的是從 0 開始的 UTF-8 位元組位置，TypeScript 給從 0 開始的 UTF-16 位置，要先換算。
  - 預覽：給 `preview: (link) => 內容`，滑鼠或鍵盤焦點停在名稱上時，名稱下方出現小卡片（名稱、定義位置、第一行說明）。

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

- 複製：`copy` 在標題列放一個複製按鈕（沒有 `file`、`title` 時也會顯示標題列），複製後提示「已複製」；`onCopy`、`onCopyError` 接手結果，例如複製失敗時用 Toast 說明。預設不顯示；Markdown 的程式碼區塊預設顯示。

外觀、鍵盤與無障礙的完整規格在 repo 的 `docs/maintaining/CodeView.md`。
