# Markdown

顯示專案文件與程式註解裡的 Markdown，例如 README.md 的摘錄、檔案開頭的註解、側邊面板裡 .md 檔的預覽。

- 支援：段落與換行、標題、粗體、斜體、行內程式碼（`UI.InlineCode`）、程式碼區塊（`UI.CodeView`，依語言上色；32 px 的矮標題列只有語言名稱和複製的小圖示，沒有分隔線也沒有行號，程式碼左右留 16 px）、連結、項目與編號清單（可巢狀）、引用、表格、水平線。圖片只顯示替代文字，不載入。
- 標題降級：`#` 顯示成 h4（20 px），`##` 是 h5，`###` 以下是 h6（兩者都是 16 px 粗體）。用 `topLevel` 改 `#` 對應的層級。
- 字級：正文和周圍文字同字級（16 px）；`size="small"` 是 13 px，給註記用。
- 表格：灰底粗體表頭（不換行）、斑馬紋加格線；全是數字的欄自動靠右、等寬數字，或依 GFM 的 `---:` 對齊。比容器寬時在表格框裡左右捲動（可以 Tab 到表格再用方向鍵），不會撐開面板；格子裡的行內程式碼換行，不撐寬欄位。表格寬度不到 480 px 時每列變成一張卡片：欄名在上、值在下，列與列之間一條線。
- 可收合的區塊：`<details><summary>另有 49 處呼叫</summary> … </details>`，和 GitHub 的寫法相同，複製到 GitHub、Notion 也能收合。一開始收合；標題列是按鈕，有 `aria-expanded`，Enter 與空白鍵切換。收合的內容留在頁面上，頁內搜尋（Ctrl+F）找到時自動展開，和 Section 一樣。`<details>` 和 `<summary>` 的屬性一律去掉（`open` 也是）。
- 提示框：GitHub 的 `> [!NOTE]`、`[!TIP]`、`[!IMPORTANT]`、`[!WARNING]`、`[!CAUTION]` 用 `UI.Alert` 顯示（info、success、info、warning、danger）。一般的 `>` 仍是引用：左邊一條線、次要文字色。
- 換行：同一段裡的換行接成空格，中文字或全形標點旁邊不加空格；行尾兩個空格或反斜線是強制換行。

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

## inline

只渲染行內語法、不產生段落，給一行摘要用，例如 README 的第一句：

```js
h(UI.Markdown, { inline: true }, '先跑 `make`，再用 **harness/run.sh** 啟動。');
```

## .md 檔的「原始碼／預覽」

CodeView 不內建預覽：由使用的地方在面板上方放 `UI.Tabs`（「原始碼」「預覽」），原始碼用 CodeView，預覽用 Markdown。

- 預覽沒有行號。連到某一行的位置（`README.md:12`、CodeView 的 `target`）時，切回「原始碼」分頁再捲到那一行。
- 預覽裡的連結和路徑交給同一組 `onLink`、`onRef`，例如在側邊面板開啟另一個檔案。

## 標題層級與 topLevel

`topLevel` 是 `#` 對應的 HTML 層級：`#` 是 h`topLevel`，`##` 再低一層，依此類推（最多 h6）。預設 4。

| 放在哪裡 | 原文的最高標題 | `topLevel` | 結果 |
|---|---|---|---|
| 頁面裡、h2 或 h3 底下 | `#` | 4（預設） | `#` 是 h4 |
| Section 裡（Section 標題是 h3） | `#` | 4 | `#` 是 h4 |
| Section 裡，原文從 `###` 開始寫 | `###` | 2 | `###` 是 h4 |

- 大小跟著層級：h4 20 px，h5、h6 16 px 粗體。在 Section 裡，h4 改成 16 px 粗體，不比 Section 的 20 px 標題大。

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

h(UI.Markdown, {
  topLevel: 2,
  schemes: ['fn'],
  linkHref: function (href) { return href.startsWith('fn:') ? '#flow=' + encodeURIComponent(href.slice(3)) : href; },
  refHref: function (ref) { return '#code=' + encodeURIComponent(ref); },
}, report);
```

畫面就是這份文字；「複製成 Markdown」直接複製 `report`，貼到 GitHub 或 Notion 時表格、收合區塊、提示框都還在。

## 範例：Section 裡放 Markdown

```js
h(UI.SectionGroup, null,
  h(UI.Section, {
    id: 'external',
    title: '外部指令',
    summary: '29 個指令、4 個 namespace、3 個沒有逾時',
    defaultOpen: true,
    actions: h(UI.IconButton, { icon: 'copy', label: '複製這一段', onClick: function () { navigator.clipboard.writeText(report); } }),
  },
    h(UI.Markdown, { topLevel: 2, schemes: ['fn'], linkHref: linkHref, refHref: refHref }, report),
  ),
);
```

- `report` 從 `###` 開始寫，所以 `topLevel: 2`，`###` 成為 h4，在 Section 的 h3 標題底下。
- 「複製這一段」放在 Section 的 `actions`，點它不會開合段落。
