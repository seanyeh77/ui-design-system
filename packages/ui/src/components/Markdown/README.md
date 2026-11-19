# Markdown

顯示專案文件與程式註解裡的 Markdown，例如 README.md 的摘錄、檔案開頭的註解、側邊面板裡 .md 檔的預覽。

- 支援：段落與換行、標題、粗體、斜體、行內程式碼（`UI.InlineCode`）、程式碼區塊（`UI.CodeView`，依語言上色；32 px 的矮標題列只有語言名稱和複製的小圖示，沒有分隔線也沒有行號，程式碼左右留 16 px）、連結、項目與編號清單（可巢狀）、引用、表格、水平線。圖片只顯示替代文字，不載入。
- 標題降級：`#` 顯示成 h4（20 px），`##` 是 h5，`###` 以下是 h6（兩者都是 16 px 粗體）。用 `topLevel` 改 `#` 對應的層級。
- 字級：正文和周圍文字同字級（16 px）；`size="small"` 是 13 px，給註記用。
- 表格：灰底粗體表頭（不換行）、斑馬紋加格線；全是數字的欄自動靠右、等寬數字，或依 GFM 的 `---:` 對齊。比容器寬時在表格框裡左右捲動（可以 Tab 到表格再用方向鍵），不會撐開面板。格子裡的名稱與路徑不拆開；指令類的程式碼在空白處換行，欄寬至少 16 em。
- 調整欄寬：表頭每一欄的右邊框可以左右拖拉（滑過、拖拉或鍵盤移到時出現 3 px 強調色的線，游標是左右箭頭），每欄最窄 48 px；拖過之後各欄維持拖出的寬度，總寬超過面板時左右捲動。鍵盤：Tab 到邊框，← → 每次 16 px，Enter 或雙擊邊框讓整張表回到依內容的寬度。觸控螢幕上不顯示拖拉邊框（手指點不到 11 px 的邊框），改用放大圖示。
- 放大表格：表格右上方有一個「放大表格」圖示，點了在全寬的對話框（最寬 1200 px）裡看整張表。點對話框裡的連結或路徑，先做連結的事（`onLink`、`onRef`），再關閉對話框；Ctrl、⌘、Shift 或中鍵點擊在新分頁開啟，對話框不關。
- 拖拉邊框、放大對話框和 DataTable 用同一份實作；DataTable 另外能記住欄寬（`widthKey`），Markdown 表格的欄位會隨內容變，沒有固定的欄位名稱可記。表格寬度不到 480 px 時每列變成一張卡片：欄名在上、值在下，列與列之間一條線。
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

### 名稱與位置的外觀

原文不用改，Markdown 自動判斷：

- 連結的文字只有一段行內程式碼（``[`VirtualRouter._sync_as`](fn:…)``）時是「名稱」：強調文字色的等寬字，沒有底色，滑過或焦點時才有底線（`InlineCode look="name"`）。
- 行內程式碼被 `refHref` 或 `onRef` 認成路徑、而且有目標時是「位置」：灰色、13 px，滑過或焦點時變強調文字色加底線（`InlineCode look="location"`）。
- 其他連結（`[說明](fn:docs)`、一般網址）照舊；沒有目標的行內程式碼維持灰底。外部網址在新分頁開啟的連結（沒有 `onLink`）也照舊。

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

AI 寫的段落、清單項目或表格格子寫 `[AI](ai:)`（開頭或結尾都可以），在那一段的最後畫成灰色小字「AI 撰寫」（`UI.AiMark`）：13 px、`ink-muted`，和前面的文字隔 8 px。`[推測](ai:)` 用同樣的樣子顯示「推測」。

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

CodeView 不內建預覽：由使用的地方在面板上方放 `UI.Tabs`（「原始碼」「預覽」），原始碼用 CodeView，預覽用 Markdown。

- 預覽沒有行號。連到某一行的位置（`README.md:12`、CodeView 的 `target`）時，切回「原始碼」分頁再捲到那一行。
- 預覽裡的連結和路徑交給同一組 `onLink`、`onRef`，例如在側邊面板開啟另一個檔案。

## 標題層級與 topLevel

`topLevel` 是 `#` 對應的 HTML 層級：`#` 是 h`topLevel`，`##` 再低一層，依此類推（最多 h6）。預設 4。

| 放在哪裡                        | 原文的最高標題 | `topLevel` | 結果        |
| ------------------------------- | -------------- | ---------- | ----------- |
| 頁面裡、h2 或 h3 底下           | `#`            | 4（預設）  | `#` 是 h4   |
| Section 裡（Section 標題是 h3） | `#`            | 4          | `#` 是 h4   |
| Section 裡，原文從 `###` 開始寫 | `###`          | 2          | `###` 是 h4 |

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

## 範例：Section 裡放 Markdown

```js
h(
  UI.SectionGroup,
  null,
  h(
    UI.Section,
    {
      id: 'external',
      title: '外部指令',
      summary: '29 個指令、4 個 namespace、3 個沒有逾時',
      defaultOpen: true,
      actions: h(UI.IconButton, {
        icon: 'copy',
        label: '複製這一段',
        onClick: function () {
          navigator.clipboard.writeText(report);
        },
      }),
    },
    h(UI.Markdown, { topLevel: 2, schemes: ['fn'], linkHref: linkHref, refHref: refHref }, report),
  ),
);
```

- `report` 從 `###` 開始寫，所以 `topLevel: 2`，`###` 成為 h4，在 Section 的 h3 標題底下。
- 「複製這一段」放在 Section 的 `actions`，點它不會開合段落。
