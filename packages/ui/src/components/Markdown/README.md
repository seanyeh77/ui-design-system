# Markdown

## 用法

顯示專案文件與程式註解裡的 Markdown，例如 README.md 的摘錄、檔案開頭的註解、側邊面板裡 .md 檔的預覽。介面上不要顯示原始的 Markdown 文字。

```tsx
<Markdown refHref={(ref) => '#code=' + ref} onLink={(href) => openInPanel(href)}>
  {readme}
</Markdown>
```

- 不執行 HTML：標籤去掉只留文字（`<details>`、`<summary>` 例外）。
- `#` 顯示成 h4；放在 Section 裡、原文從 `###` 開始寫時用 `topLevel`（見下方）。
- 標題可以換行：文件裡的標題由作者寫，長度無法控制，截斷會看不到；`ui check` 不檢查 Markdown 標題（`.ui-md-h`）。介面標題（頁面、卡片、對話框）仍不換行。
- 路徑和行號（`routing.py:108`）用 `refHref`／`onRef` 變成連結；連結文字只有一段行內程式碼的自動用名稱外觀。
- AI 寫的段落寫 `[AI](ai:)`；提示用 `> [!NOTE]` 這類 GitHub 提示框；可收合的長清單用 `<details><summary>`。
- .md 檔的「預覽／原始碼」用 `SegmentedControl` 切換（放在 Workbench 的 `mainBar` 時加 `iconOnly`）。

## 安全

- 不執行任何 HTML。原文裡的 HTML 標籤與註解直接去掉，只留標籤之間的文字（`<b>粗</b>` 顯示成「粗」）。唯一的例外是 `<details>` 與 `<summary>`，屬性一律去掉。
- 連結只允許 http、https、mailto 與相對路徑；其他網址只顯示文字。`schemes` 列出的自訂 scheme（例如 `fn:`）交給 `linkHref` 與 `onLink` 決定；`javascript:`、`data:`、`vbscript:` 列在裡面也一律擋掉。

## 連結與路徑

```js
h(
  UI.Markdown,
  {
    linkHref: function (href) {
      return '#open=' + href;
    }, // 連結的網址；回傳 undefined 表示不做連結
    onLink: function (href, e) {
      openInPanel(href);
    }, // 一般點擊（Ctrl、⌘、Shift 仍照 linkHref 開新分頁）
    refHref: function (ref) {
      return '#code=' + ref;
    }, // 行內程式碼是路徑時，例如 `harness/routing.py:108`
    onRef: function (ref, e) {
      openInPanel(ref);
    },
  },
  readme,
);
```

- 行內程式碼是路徑（有資料夾的檔名 `docs/a.md`，或檔名加行號 `routing.py:108`）時走 `refHref`、`onRef`，和 CodeView、CodeText 一致；`make` 這類一般程式碼不是連結。程式碼區塊裡註解與字串中的路徑也一樣。
- 沒有給 `linkHref` 時連結照原網址；外部網址在新分頁開啟。
- 自訂 scheme：`schemes={['fn']}` 之後，`[_sync_as](fn:harness/controller.py:VirtualRouter._sync_as)` 原樣交給 `linkHref` 與 `onLink`；`linkHref` 沒有回傳網址、也沒有 `onLink` 時只顯示文字。

連結文字只有一段行內程式碼時顯示成「名稱」，被 `refHref`／`onRef` 認成路徑的行內程式碼顯示成「位置」，原文不用改。

## 名詞說明（terms）

文件裡讀者可能看不懂的詞，用 `terms` 加上說明（`Term variant="inline"`：灰色虛線，滑過 500 ms 打開小卡）。兩種寫法可以一起用：

- 自動：給 `terms`（`{ term, title?, text, action? }`，和 CodeView 相同），一般文字裡出現的詞自動標記。整個字、分大小寫（`cookie` 不算 `cookies`）。標題、連結文字、行內程式碼和 `<summary>` 裡不標；程式碼區塊只標註解和字串。
- 指定：`[cookie](term:cookie)` 明確標記這一處，`term:` 後面是 `terms` 裡的 `term`（有空白時寫成 `%20`）。找不到時只顯示文字，開發模式在 console 提醒。其他 Markdown 檢視器會把它顯示成一般連結。
- 預設每個詞在每個段落、清單項目或表格格子只標第一次；程式碼區塊每一段只標第一次。`termsMark: 'all'` 每次都標。

```js
h(UI.Markdown, {
  terms: [
    { term: 'cookie', text: '瀏覽器替網站保存的一小段文字，之後每次請求都會帶上。' },
    { term: 'session', title: '工作階段', text: '伺服器記住同一位使用者的一段期間，靠 cookie 認出是誰。' },
  ],
  children: '登入後伺服器寫入 cookie，之後每次請求都帶上這個 cookie。\n\n[工作階段](term:session) 過期時要重新登入。',
});
```

## AI 標記

AI 寫的段落、清單項目或表格格子寫 `[AI](ai:)`（開頭或結尾都可以），在那一段的最後畫成灰色小字「AI 撰寫」（`UI.AiMark`）。`[推測](ai:)` 用同樣的樣子顯示「推測」。

```md
這個函式在每次路由表變動時重新建立連線，所以第 540 行的呼叫次數會隨鄰居數增加。[AI](ai:)

- 清單項目和表格格子也可以。[AI](ai:)
- 由文字推得的關係。[推測](ai:)
```

- 不是連結，Tab 不會停在上面；螢幕閱讀器在句子後面念「（AI 撰寫）」。

## inline

只渲染行內語法、不產生段落，給一行摘要用，例如 README 的第一句：

```js
h(UI.Markdown, { inline: true }, '先跑 `make`，再用 **harness/run.sh** 啟動。');
```

## .md 檔的「原始碼／預覽」

CodeView 不內建預覽：由使用的地方放一個 `SegmentedControl`（「預覽」「原始碼」）切換，原始碼用 CodeView，預覽用 Markdown。放在 Workbench 的 `mainBar` 時加 `iconOnly`。

- 預覽沒有行號。連到某一行的位置（`README.md:12`、CodeView 的 `target`）時，切回「原始碼」分頁再捲到那一行。
- 預覽裡的連結和路徑交給同一組 `onLink`、`onRef`，例如在側邊面板開啟另一個檔案。

## 標題層級與 topLevel

`topLevel` 是 `#` 對應的 HTML 層級：`#` 是 h`topLevel`，`##` 再低一層，依此類推（最多 h6）。預設 4。

| 放在哪裡                        | 原文的最高標題 | `topLevel` | 結果        |
| ------------------------------- | -------------- | ---------- | ----------- |
| 頁面裡、h2 或 h3 底下           | `#`            | 4（預設）  | `#` 是 h4   |
| Section 裡（Section 標題是 h3） | `#`            | 4          | `#` 是 h4   |
| Section 裡，原文從 `###` 開始寫 | `###`          | 2          | `###` 是 h4 |


## 範例：用 Markdown 顯示一份結構化報告

```js
var report = [
  '### harness/controller.py（可修改）',
  '',
  '| 指令 | 位置 | namespace | 逾時 |',
  '|---|---|---|---|',
  '| `ip netns exec l3-r1 ip -j route` | [`_sync_as`](fn:harness/controller.py:VirtualRouter._sync_as) `harness/controller.py:540` | l3-r1 | 5 秒 |',
  '',
  '<details><summary>另有 49 處呼叫</summary>',
  '',
  '| 指令 | 位置 |',
  '|---|---|',
  '| `ovs-vsctl show` | `harness/runtime.py:88` |',
  '',
  '</details>',
  '',
  '> [!WARNING]',
  '> 3 個指令沒有設逾時。',
].join('\n');

h(
  UI.Markdown,
  {
    topLevel: 2,
    schemes: ['fn'],
    linkHref: function (href) {
      return href.startsWith('fn:') ? '#flow=' + encodeURIComponent(href.slice(3)) : href;
    },
    refHref: function (ref) {
      return '#code=' + encodeURIComponent(ref);
    },
  },
  report,
);
```

畫面就是這份文字；「複製成 Markdown」直接複製 `report`，貼到 GitHub 或 Notion 時表格、收合區塊、提示框都還在。

放在 Section 裡時，`report` 從 `###` 開始寫就給 `topLevel: 2`（`###` 成為 h4，在 Section 的 h3 標題底下）；「複製這一段」放在 Section 的 `actions`，點它不會開合段落。

外觀、鍵盤與無障礙的完整規格在 repo 的 `docs/maintaining/Markdown.md`。
