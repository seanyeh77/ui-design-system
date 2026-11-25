# PageHeader

## 用法

詳細頁（一筆訂單、一個專案）的頁首：那筆資料的名稱、狀態、一行重點資訊和操作。清單頁不用它。

```tsx
<AppShell nav={nav} value="orders" onNavigate={go}>
  <Page>
    <Breadcrumb items={[{ label: '訂單', href: '/orders' }, { label: '#1024' }]} />
    <PageHeader
      title="訂單 #1024"
      status={<Badge status="doing">出貨中</Badge>}
      meta={['建立於 2026/11/04（三）', '負責人 王小明']}
      primary={{ label: '出貨', onClick: ship }}
      actions={[{ label: '編輯', icon: 'pencil-simple', onClick: edit }]}
      more={[{ label: '刪除', icon: 'trash', danger: true, confirm: { title: '刪除訂單 #1024？' }, onSelect: remove }]}
    />
    <Grid columns={[2, 1]}>…</Grid>
  </Page>
</AppShell>
```

- `title` 是那筆資料的名稱（頁面唯一的 h1），這時 AppShell 不給 `title`；頂部列已有標題時 PageHeader 不給 `title`，只放狀態、資訊和操作。
- 操作：`primary` 最多一個實心按鈕；`actions` 是外框按鈕，最多 3 個；其他和危險操作放 `more`（「⋯」選單，危險項目會先確認）。
- 手機（小於 600 px）：只有 `primary` 保持按鈕，`actions` 收進「⋯」。
- `status` 放 Badge，和 `meta` 在標題下同一行、同一個字級。
- `meta` 給陣列時以「 · 」連起來，全形「）」後面不加空格（「（三）· 負責人」）；給字串時也照這個規則調整，日期的「）」和時間之間不留空格（「（三）13:00」）。

## 細節

- 標題 20 px（`text-h4`）、字重 700，不換行，太長用「…」；標題至少保留 8 個字，操作放不下時換到下一列靠右。
- 狀態和資訊 14 px（`text-compact`）、`ink-muted`，兩者間隔 16 px。
- 頁首和下面的內容間隔照 `Page`（32 px）。
- `labels.more` 換「⋯」按鈕的名稱（預設「更多操作」）。
