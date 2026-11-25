# RelativeTime

## 用法

顯示「2 小時前」、「昨天」這類相對時間，而且會自己更新：每分鐘重新顯示一次，頁面上所有 RelativeTime 共用一個計時器。只要固定的日期（建立日期、截止日）用 `format.date`；表格欄位用 DataTable 的 `format: 'relative'`，它已經用這個元件。

```tsx
<RelativeTime value={item.updatedAt} />
<RelativeTime value="2026-11-18T09:30:00+08:00" />
```

- 輸出 `<time datetime="…">`，`datetime` 是完整的時間（ISO 8601），螢幕閱讀器和複製都拿得到精確時間。
- 規則和 `format.relative` 一樣：1 小時內寫分鐘；同一天寫小時；跨過午夜以日曆天計算，昨天任何時間都是「昨天」；7 個日曆天以上或未來的時間寫完整日期時間。
- 需要完整日期時間的提示時，自己包 `Tooltip`，內容用 `format.dateTime(d)`。
- 伺服器先渲染時，瀏覽器接手後會依自己的時鐘重新顯示一次，不會出現 hydration 警告。

## Props

| Prop | 說明 |
| --- | --- |
| `value` | 時間：`Date`、ISO 字串或毫秒數。無效的時間不顯示任何東西。 |
| `children` | 選用，`(text) => ReactNode`，包住顯示的文字，例如標出搜尋符合的字。 |
| 其他 | `className`、`ref`、`title` 等 `<time>` 的屬性都會傳給它（可以包在 `Tooltip` 裡）。 |
