# Card

## 用法

頁面上的區塊容器：`surface` 底、`shadow-card` 陰影、14 px 圓角，內距 16 px。每個區塊一張 Card，用 `Grid` 排。

```tsx
<Card title="每個程式的耗時" actions={<Button icon="download-simple">匯出</Button>} padding={false}>
  <DataTable label="每個程式的耗時" columns={columns} rows={rows} />
</Card>
```

- 卡片裡不再放卡片。TreeList、KpiCard、Alert、SettingsSection、DangerZone 本身就有卡片樣式：單獨使用時直接當成區塊，不要再包一層；放進 Card 時會自動拿掉自己的陰影，TreeList 也拿掉底色。
- 自己寫的區塊不要另外加陰影，改用 Card；卡片裡要再分區時用 `surface-sub` 底色或分隔線。
- 卡片裡放表格時，標題寫在 Card 的 `title`，DataTable 不再給 `caption`，改給同樣文字的 `label`。清單頁的主要操作（「新增」）給 DataTable 的 `action`，不放 Card 的 `actions`。
- `padding={false}`：沒有內距，給整張卡片放表格或樹狀清單時用。

## 細節

- `title` 和 `actions`：標題列，左邊標題，右邊按鈕。沒有 `title` 時按鈕一樣靠右，左邊不留空位。標題至少保留 8 個字：按鈕放不下時換到標題下一列、靠右，標題不會被截成「訂..」。清單頁的「新增」不放這裡（一個按鈕單獨占一列）：給 DataTable 的 `action`，放在工具列的右端。
- `padding: false` 時，標題列、DataTable 的工具列（含摘要）、頁碼和「向右捲動」提示仍留 16 px 左右內距，表格本身貼齊卡片左右兩邊（拿掉表格自己的左右框線與圓角）。表格下方沒有頁碼和提示時，最後一列直接到卡片底邊，不留空白，也不多一條底線。
- DataTable 的 `label` 讓螢幕閱讀器念表格名稱，放大表格的對話框也用它當標題。`caption` 留給沒有包在 Card 裡、直接放在頁面上的表格。

```tsx
<Card title="流程" actions={<Button icon="magnifying-glass">換起點</Button>}>
  <Tabs … />
  <TreeList kind="plain" items={items} height={640} /> {/* 沒有自己的陰影 */}
</Card>
```
