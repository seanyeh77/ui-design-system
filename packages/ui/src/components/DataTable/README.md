# DataTable

## 用法

資料表格，有排序、勾選、篩選和頁碼；只給欄位就有合適的欄寬、工具列和列的狀態。不用原生 `<table>`。檔案和階層用 TreeList；一個項目的欄位用 DetailList。

```tsx
type Import = { id: string; name: string; status: BadgeStatus; source: string; secs: number; records: number; created: string; error?: string; progress?: string };

// 欄位寫在元件外面（或 useMemo）：每次渲染同一個陣列。
const columns: DataTableColumn<Import>[] = [
  { key: 'name', label: '檔案', secondary: (r) => r.error ?? r.progress },
  { key: 'status', label: '狀態', mobile: 'status', render: (r) => <Badge status={r.status} />, searchText: (r) => statusLabel[r.status] },
  { key: 'source', label: '來源' },
  { key: 'secs', label: '耗時', format: 'duration' },
  { key: 'records', label: '筆數', numeric: true, unit: '筆' },
  { key: 'created', label: '建立時間', format: 'relative' },
];

<Card padding={false}>
  <DataTable<Import>
    label="匯入紀錄"
    rows={imports ?? []}
    loading={!imports}
    rowHref={(r) => `/imports/${r.id}`}
    selectable
    summary={{ key: 'status', items: [{ value: 'fail', label: '失敗' }, { value: 'doing', label: '進行中' }, { value: 'done', label: '完成' }] }}
    action={<Button variant="primary" icon="plus" onClick={create}>新增</Button>}
    filters={[{ key: 'source', label: '來源' }]}
    bulkActions={(ids, clear) => <Button onClick={() => retry(ids).then(clear)}>重試</Button>}
    rowActions={(r) => (r.status === 'fail' ? <IconButton variant="quiet" label={`重試 ${r.name}`} icon="arrows-clockwise" onClick={() => retry([r.id])} /> : null)}
    columns={columns}
  />
</Card>
```

預設就有：主要文字欄占剩下的寬度、其他欄貼合內容；一列工具列（摘要分段、搜尋、「篩選」「排序」「⋯」和 `action`，放不下時摘要自己一列）；手機上變成卡片清單。

- 清單頁的「新增」（一個 `primary`）給 `action`，在工具列最右端；Card 的 `title`、`label` 怎麼給見 guidelines 的「常見頁面」。
- 主要的文字欄放第一欄：它占剩下的寬度，也是手機卡片的標題和列的名稱。每列給 `id`。
- 數字給 `numeric: true` 加 `unit`（傳數字 `1234`，不傳 `'1,234 筆'`）；金額用 `format: 'money'`；長度（秒）用 `format: 'duration'`；日期用 `format: 'date' | 'dateTime' | 'relative'`。ID、代碼、雜湊和路徑的欄位給 `mono: true`。
- 失敗的列：原因寫在 `secondary`（第二行），「重試」放 `rowActions`，可勾選時 `bulkActions` 也放。進行中的列：`doing` 的 Badge，進度文字（「匯入中 42%」）寫在 `secondary`，格子裡不放 ProgressBar。
- `rowActions` 最多 2 個 IconButton，不占一欄（滑過列時出現在右端）；更多操作由頁面自己放進一個「⋯」`Menu`（第 2 個按鈕的位置）。有自己頁面的列給 `rowHref`，不另加「開啟」按鈕。
- 載入中給 `loading`：工具列和表頭留著，列的位置是 `loadingRows` 列（預設每頁筆數，最多 10 列）和欄位同形狀的 Skeleton，不另外放一塊 Skeleton。
- 同一個條件只放一個地方：狀態用 `summary` 時，`filters` 和 `views` 不再篩選同一欄（開發時 console 會警告）。

## 參考

- `summary={{ key, items: [{ value, label }] }}`：工具列最前面的摘要分段，「全部」加各狀態和筆數（單位只念不寫，`summary.unit` 預設「筆」），點了只看那一種。要處理的狀態放在「全部」後面。
- `filters={[{ key, label, type: 'list' | 'range' }]}`：「篩選」彈出框，勾選即生效；條件列在工具列下方，可逐一移除。`list` 的選項沒給時從資料取出；`range` 用 `scale`、`unitLabel` 換輸入單位。選項互斥時 `multiple: false`。
- 搜尋：預設搜尋所有欄位，按「/」移到搜尋框；`search.keys` 限定欄位，`render` 的欄位給 `searchText`；`search: false` 拿掉搜尋框。筆數：有 `summary` 時「全部 24」已經是筆數，工具列只在搜尋或篩選後顯示「10 / 24 筆」；沒有 `summary` 時一頁內的表格顯示「24 筆」，有頁碼時由下方的「第 1–10 筆，共 24 筆」說。螢幕閱讀器一律念得到筆數。每一處筆數的單位是 `unit`（預設 `summary.unit`，再沒有是「筆」）。
- `toolbar={false}`：沒有工具列，給 3 到 5 列、不需要搜尋和篩選的小表格；點欄位標題仍可排序。
- 排序：點欄位標題，Shift＋點加成下一層；`defaultSort`、`maxSort`，`sortValue` 給排序用的值，`sortable: false` 不能排序。
- `selectable` 加 `bulkActions={(ids, clear) => …}`：勾選後表格上方出現「已選 n 筆」和批次按鈕；看不到的列自動取消勾選。
- `rowHref={(row) => url}`：整列是連結（中鍵、Ctrl＋點開新分頁）；SPA 另給 `onRowOpen` 推路由。第一欄的 `render` 裡不再放連結。
- `totals={{ amount: 'sum', rate: 'avg' }}`：合計列，有金額或數量要加總時才開（看情況）。`stickyFirst`：欄位多、常橫向捲動時固定第一欄（看情況）。`views`：幾組固定的看法（「我負責的」）時才開（看情況）。
- 欄位：`hidden: true` 一開始不顯示（「⋯」的「欄位」可以打開）；`width` 只是最小寬度；`grow` 改變分剩下寬度的份數；`long: true` 的長文字截斷並可展開；`fullText` 給縮短的格子完整文字；`currency`、`decimals` 調整格式。
- 手機（小於 600 px）：每列一張卡片，第一欄是標題，`mobile: 'status'` 的欄在標題右邊，`mobile: 'hide'` 不顯示，其他欄「欄名｜值」一行一欄，`rowActions` 在卡片最下面。
- 記住讀者的選擇：`storageKey` 把拖出的欄寬和顯示的欄位存在 localStorage（和其他元件同名；`widthKey` 已棄用）。換成另一份資料時給新的 `resetKey`；同一頁兩個表格用 `urlKey` 分開網址參數，`urlSync={false}` 不寫網址。
- `emptyText`：搜尋或篩選後沒有結果的一句話（預設「沒有符合的資料」）。完全沒有資料時用 EmptyState，見 guidelines。
- 「⋯」裡的放大表格（`zoom`）、複製成 Markdown（`copy`、`copyText`、`onCopyError`）預設開；`columnMenu={false}` 拿掉「欄位」。
- 不放在 Card 裡、直接放在頁面上的表格用 `caption` 當標題。

外觀、欄寬計算、工具列排法、動畫與手機卡片的完整規格在 repo 的 `docs/maintaining/DataTable.md`。
