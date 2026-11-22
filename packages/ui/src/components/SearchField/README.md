# SearchField

## 用法

頁面或清單內的搜尋欄。整個產品的搜尋用 CommandPalette；DataTable 已經有自己的搜尋框。

```tsx
<SearchField value={q} onChange={setQ} label="搜尋專案" />
```

- 外框輸入框，左邊放大鏡圖示。
- 有內容時右邊出現清除鈕；瀏覽器內建的清除鈕已隱藏，不會出現兩個叉。清除鈕用 Tab 可以停，Focus 時有外光暈。
- `label` 預設為「搜尋」，作為 `aria-label`。
