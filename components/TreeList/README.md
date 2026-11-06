# TreeList

資料夾裡放檔案、可以一層層展開的清單。

```js
h(UI.TreeList, {
  title: '課程教材',
  items: [
    { id: 'rec', name: '上課錄影', children: [
      { id: 'r4', name: 'SDNFV_20261029_1.mp4', date: '2026-11-05T01:16', size: 144284057, unseen: true }
    ] },
    { id: 'f1', name: '課程評分方式.docx', date: '2026-09-22', size: 53248 }
  ],
  defaultOpen: ['rec'],
  onDownload: function (files) { /* 一個或多個檔案 */ }
})
```

## 資料

- 資料夾有 `children`（可以是空陣列），檔案沒有。每個項目都要有唯一的 `id`。
- 檔案：`name`（副檔名從檔名取，也可以另外給 `ext`）、`date`（Date、時間戳或日期字串）、`size`（位元組）、`unseen`（使用者還沒打開或下載過）。
- 資料夾的檔案數和最新時間自動從裡面的檔案算出來，沒有資料就不顯示。

## 選項

- `sort`：`'newest'`（預設）、`'oldest'`、`'name'`，或 `false` 照資料原本的順序。資料夾一律排在檔案前面。看情況選。
- `expand`：`'multi'`（預設，點資料夾展開或收合，標題列有「全部展開」）或 `'single'`（一次只開一個，同層的其他資料夾自動收合）。需要一次看到全部時用 `'multi'`，資料夾又多又雜時用 `'single'`。
- `defaultOpen`：一開始展開的資料夾 `id`。
- `selectable`：顯示勾選框（滑過才出現，勾了一個之後全部顯示；觸控裝置一直顯示）。勾資料夾等於全選裡面的檔案。勾選後標題列換成「已選 n 個檔案 共 x MB」、「清除選取」和「下載」。`selected` 加 `onSelectChange` 可以由外部控制（只會有檔案的 `id`）。`bulkActions(files, clear)` 可以再加按鈕。
- `onDownload(files)`：每個檔案右邊的下載按鈕和批次下載都會呼叫它。
- `onOpen(file)`：點檔案列或按 Enter；沒給時改成下載。打開或下載後，請把那個檔案的 `unseen` 改成 `false`。
- `title`、`actions`：標題列的文字和右邊的按鈕。沒有標題時用 `label` 給螢幕閱讀器。
- `emptyText`：沒有任何項目時的文字，預設「這裡還沒有檔案」。

## 外觀

- 每層縮排 28 px，左側細線（`line`）。資料夾用 Phosphor 的 folder／folder-open，前面有會轉 90° 的箭頭。
- 檔案圖示：文件形狀，底部色塊寫副檔名。PDF 紅、影片紫、音訊桃紅、簡報橘、文件藍、試算表綠、圖片青、程式碼深灰、壓縮檔和其他灰。
- 清單寬 640 px 以上：日期和大小在右側排成欄（Geist Mono）。比較窄：放在名稱下方，檔名最多兩行。
- 新檔案（`unseen`）：日期變 `accent-text` 粗體；資料夾旁寫「2 個新」。
- 滑過列 `surface-sub`，勾選中的列 `accent-soft`。
- 展開時子項目往下長出 260 ms；減少動態效果時改成淡入。

## 一般的樹

`kind="plain"` 用在不是檔案的階層，例如呼叫關係、元件結構。

```js
h(UI.TreeList, {
  kind: 'plain', label: '呼叫流程',
  items: [{ id: 'root', name: 'trace_post_send', path: 'src/libibtrace/hooks/ops.c:55', children: [
    { id: 'hook_of', name: 'hook_of', path: 'src/libibtrace/hooks/ops.c:58', tags: ['編譯器'] },
    { id: 'gettime', name: 'clock_gettime', meta: 'libc.so.6', tags: ['外部'], muted: true }
  ] }],
  defaultOpen: ['root'], selectedId: sel, onSelect: function (n) { setSel(n.id); }
})
```

- 每一列：名稱、分類標籤（`tags`，用 `UI.Tag` 顯示），名稱下方是位置：`meta` 直接顯示，或 `path` 用 `UI.format.path()` 保留頭尾、中間省略。
- 照資料原本的順序；有子項目的不會被排到前面。`sort` 仍然可以指定。
- 點一列呼叫 `onSelect`，選中的列是 `accent-soft` 底；點左邊的箭頭才展開或收合。Enter 選取，→ ← 展開收合。
- `muted: true` 的項目名稱用次要文字色（例如外部函式）。`icon` 可以放 Phosphor 圖示名稱。
- 預設不顯示「全部展開」；需要時加 `toggleAll: true`。沒有勾選和下載。

## 手機上的縮排

清單寬度小於 600 px 時（看清單本身的寬度），每層縮 16 px，最多縮 3 層；更深的不再縮排，名稱前加層數「L5」。檔案清單和一般的樹都適用。

## 鍵盤

一次只有一列能用 Tab 進入。↑ ↓ 移動，Home／End 到頭尾，→ 展開（已展開就到第一個子項目），← 收合或回到上一層，Enter 打開檔案或切換資料夾，空白鍵勾選。

`UI.format.fileSize(bytes)` 可以把位元組寫成「186 KB」、「54.9 MB」。
