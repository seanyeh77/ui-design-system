# Markdown

顯示專案文件與程式註解裡的 Markdown，例如 README.md 的摘錄、檔案開頭的註解、側邊面板裡 .md 檔的預覽。

- 支援：段落與換行、標題、粗體、斜體、行內程式碼（`UI.InlineCode`）、程式碼區塊（`UI.CodeView`，依語言上色；32 px 的矮標題列只有語言名稱和複製的小圖示，沒有分隔線也沒有行號，程式碼左右留 16 px）、連結、項目與編號清單（可巢狀）、引用、表格、水平線。圖片只顯示替代文字，不載入。
- 標題降級：`#` 顯示成 h4（20 px），`##` 是 h5，`###` 以下是 h6（兩者都是 16 px 粗體）。用 `topLevel` 改 `#` 對應的層級。
- 字級：正文和周圍文字同字級（16 px）；`size="small"` 是 13 px，給註記用。
- 表格：灰底粗體表頭、斑馬紋加格線；全是數字的欄自動靠右、等寬數字。比容器寬時左右捲動。
- 換行：同一段裡的換行接成空格，中文字或全形標點旁邊不加空格；行尾兩個空格或反斜線是強制換行。

## 安全

- 不執行任何 HTML。原文裡的 HTML 標籤與註解直接去掉，只留標籤之間的文字（`<details>評分細節</details>` 顯示成「評分細節」）。
- 連結只允許 http、https、mailto 與相對路徑；`javascript:`、`data:` 等其他網址只顯示文字。

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

## inline

只渲染行內語法、不產生段落，給一行摘要用，例如 README 的第一句：

```js
h(UI.Markdown, { inline: true }, '先跑 `make`，再用 **harness/run.sh** 啟動。');
```

## .md 檔的「原始碼／預覽」

CodeView 不內建預覽：由使用的地方在面板上方放 `UI.Tabs`（「原始碼」「預覽」），原始碼用 CodeView，預覽用 Markdown。

- 預覽沒有行號。連到某一行的位置（`README.md:12`、CodeView 的 `target`）時，切回「原始碼」分頁再捲到那一行。
- 預覽裡的連結和路徑交給同一組 `onLink`、`onRef`，例如在側邊面板開啟另一個檔案。
