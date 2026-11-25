# TreeList

## 用法

資料夾裡放檔案、可以一層層展開的清單，例如專案文件、共用資料夾；`kind="plain"` 給不是檔案的階層（呼叫關係、元件結構）。本身就是卡片，不再包 Card（要放進現有面板時給 `bare`）。

```js
h(UI.TreeList, {
  title: '課程教材',
  items: [
    { id: 'rec', name: '上課錄影', children: [{ id: 'r4', name: 'Course_20261029_1.mp4', date: '2026-11-05T01:16', size: 144284057, unseen: true }] },
    { id: 'f1', name: '課程評分方式.docx', date: '2026-09-22', size: 53248 },
  ],
  defaultOpen: ['rec'],
  onDownload: function (files) {
    /* 一個或多個檔案 */
  },
});
```

- 放在固定高度的版面（例如側邊面板）時一定要給 `height`，不然下面的項目看不到。
- 排序（`sort`）、展開方式（`expand`）、勾選（`selectable`）看情況決定。
- 打開或下載後，把那個檔案的 `unseen` 改成 `false`。
- 標籤只標例外：大部分列都一樣的屬性不標，只標需要留意的（用 Tag 包 Term），預設值在樹下方說明一次。「有值得注意的地方」用 `mark`，不用 `tags`。

## 資料

- 資料夾有 `children`（可以是空陣列），檔案沒有。每個項目都要有唯一的 `id`。
- 檔案：`name`（副檔名從檔名取，也可以另外給 `ext`）、`date`（Date、時間戳或日期字串）、`size`（位元組）、`unseen`（使用者還沒打開或下載過）。
- 資料夾的檔案數和最新時間自動從裡面的檔案算出來，沒有資料就不顯示。
- 子項目很多時（例如呼叫關係）可以延遲載入：項目給 `hasChildren: true`、不給 `children`，再給 `loadChildren(node)`，回傳子項目陣列或 Promise。展開時才載入，載入中顯示一列骨架；失敗時寫「無法載入 X 的子項目：原因。」和「重試」。載入過的不會重複載入。
- `tags` 可以放文字或元件，例如 `h(UI.Term, …)`。標籤的文字會念在名稱後面；元件裡讀不出文字時，用 `ariaLabel` 指定整個項目要念的名稱。

## 選項

- `sort`：`'newest'`（預設）、`'oldest'`、`'name'`，或 `false` 照資料原本的順序。資料夾一律排在檔案前面。看情況選。
- `expand`：`'multi'`（預設，點資料夾展開或收合，標題列右邊有「全部展開／全部收合」圖示按鈕，和 Section 的一樣，名稱和提示寫目前會做哪一個）或 `'single'`（一次只開一個，同層的其他資料夾自動收合）。需要一次看到全部時用 `'multi'`，資料夾又多又雜時用 `'single'`。
- `meta`：名稱下方的次要文字（例如「2 個 caller」），一般字體、數字用 Geist Mono；沒有 `meta` 時顯示 `path`，整行 Geist Mono。
- `title` 加 `subtitle`：標題和下方一行次要文字（例如「17 個檔案」）。
- `height`：固定高度（例如 `'100%'` 填滿外層、或 `520`），標題列不動，清單在裡面捲動。放在固定高度的版面（例如側邊面板）時一定要給，不然下面的項目看不到。
- TreeList 本身就是一張卡片，不要再包進另一張卡片。真的要放進現有的卡片或面板時給 `bare`：沒有底色、陰影和圓角。
- `defaultOpen`：一開始展開的資料夾 `id`。
- `open` 加 `onToggle(node, isOpen, openIds)`：由外部控制展開，例如寫進網址。給了 `open` 時，請在 `onToggle` 裡更新它。
- `selectable`：顯示勾選框（滑過才出現，勾了一個之後全部顯示；觸控裝置一直顯示）。勾資料夾等於全選裡面的檔案，只勾一部分時資料夾顯示橫線。勾選後標題列換成「已選 n 個檔案 共 x MB」、「清除選取」和「下載」。`values` 加 `onValuesChange` 可以由外部控制（只會有檔案的 `id`）。`bulkActions(files, clear)` 可以再加按鈕。
- `onDownload(files)`：每個檔案右邊的下載按鈕和批次下載都會呼叫它。下載按鈕一直顯示在每個檔案的最右邊。
- `onOpen(file)`：點檔案列或按 Enter；沒給時改成下載。打開或下載後，請把那個檔案的 `unseen` 改成 `false`。
- `title`、`actions`：標題列的文字（17 px）和右邊的按鈕。沒有標題時用 `label` 給螢幕閱讀器。
- `emptyText`：沒有任何項目時的文字，預設「這裡還沒有檔案」。

## 一般的樹

`kind="plain"` 用在不是檔案的階層，例如呼叫關係、元件結構。

```js
h(UI.TreeList, {
  kind: 'plain',
  label: '呼叫流程',
  items: [
    {
      id: 'root',
      name: 'trace_post_send',
      path: 'src/server/hooks/ops.c:55',
      children: [
        { id: 'hook_of', name: 'hook_of', path: 'src/server/hooks/ops.c:58', tags: ['編譯器'] },
        { id: 'gettime', name: 'clock_gettime', meta: 'libc.so.6', tags: ['外部'], muted: true },
      ],
    },
  ],
  defaultOpen: ['root'],
  value: sel,
  onChange: setSel,
});
```

- 沒有檔案圖示和大小。每一列：名稱、分類標籤（`tags`，用 `UI.Tag` 顯示），名稱下方是位置：`meta` 直接顯示，或 `path` 用 `UI.format.path()` 保留頭尾、中間省略。
- 照資料原本的順序；有子項目的不會被排到前面。`sort` 仍然可以指定。
- 點一列呼叫 `onChange(id, node)`（`value` 是選中的 id），選中的列是 `accent-soft` 底；有子項目的列同時展開或收合（點名稱或左邊的箭頭都可以）。Enter 一樣：選取，有子項目時同時展開或收合；→ ← 只展開或收合。再點一次（或按 Enter）已選取的列只呼叫 `onChange`，不展開、不收合，也不重跑展開動畫；要收合請點左邊的箭頭或按 ←。
- `muted: true` 的項目名稱用次要文字色（例如外部函式）。`icon` 可以放 Phosphor 圖示名稱。
- 預設不顯示「全部展開」；需要時加 `toggleAll: true`。沒有勾選和下載。

## 緊密模式（density="compact"）

給檔案總管或側欄裡的大綱用：`kind="plain"` 加 `density="compact"`，每列 28 px、13 px 字、圖示 16 px，`meta` 放在名稱右邊同一行。觸控螢幕上每列仍是 48 px。通常再加 `bare`，放進沒有卡片的面板。

```tsx
<TreeList kind="plain" density="compact" bare label="檔案" items={tree} value={sel} onChange={setSel} />
```

## 標記（mark）

節點後面表示「有值得注意的地方」的小圓點：`mark: { label: '有值得注意的地方', tone: 'warning' }`。

- 6 px 圓點，靠列的右邊對齊，上下排成一直線，一眼掃得到。
- `tone`：`warning`（預設，橘）、`danger`（紅）、`accent`（強調色）。
- 畫面上不放文字；螢幕閱讀器在名稱後面念 `label`，滑鼠停上去也看得到。
- 不要把元素塞進 `tags` 做標記，`tags` 是分類用的文字。

外觀、鍵盤與無障礙的完整規格在 repo 的 `docs/maintaining/TreeList.md`。
