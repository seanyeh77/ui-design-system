# Card

頁面上的區塊容器：`surface` 底、`shadow-card` 陰影、14 px 圓角，內距 16 px。

- 卡片裡不再放卡片，避免一層層的陰影。TreeList、KpiCard、Alert、SettingsSection 本身就有卡片樣式：單獨使用時直接當成區塊，不要再包一層；放進 `UI.Card` 時會自動拿掉自己的陰影，TreeList 也拿掉底色。
- 自己寫的區塊不要另外加陰影，改用 `UI.Card`；需要分出一塊時用 `surface-sub` 底色或分隔線。
- `title` 和 `actions`：標題列，左邊標題，右邊按鈕。
- `padding: false`：沒有內距，給整張卡片放表格或樹狀清單時用。標題列、DataTable 的工具列、`summary` 分段控制、頁碼和「向右捲動」提示仍留 16 px 左右內距，表格本身貼齊卡片左右兩邊（拿掉表格自己的左右框線與圓角）。
- 卡片裡放表格時，標題寫在 Card 的 `title`，DataTable 不再給 `caption`，改給同樣文字的 `label`：螢幕閱讀器用它念表格名稱，放大表格的對話框也用它當標題。`caption` 留給沒有包在 Card 裡、直接放在頁面上的表格。

```js
h(UI.Card, { title: '每個程式的耗時', padding: false },
  h(UI.DataTable, { label: '每個程式的耗時', columns, rows }))
```

```js
h(UI.Card, { title: '流程', actions: h(UI.Button, { icon: 'magnifying-glass' }, '換起點函式') },
  h(UI.Tabs, { … }),
  h(UI.TreeList, { kind: 'plain', items, height: 640 }))   // 沒有自己的陰影
```
