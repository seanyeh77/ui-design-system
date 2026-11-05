# TextField

單行文字輸入，標籤在上、說明或錯誤在下。

- 外框樣式：`surface-input` 底色、`line-strong` 邊框、`radius-md`。
- focus：邊框變 `accent` 並加 3 px `focus-ring` 光暈。
- 錯誤：`error` 給一句原因加修正方式；邊框變 `danger`，欄位內右側出現警示圖示，訊息用 `danger-text`。輸入框帶 `aria-invalid` 與 `aria-describedby`。
- 停用：`surface-sub` 灰底、`ink-muted` 灰字、無邊框。
- 標籤一定要有，不要只靠 placeholder。
- 必填：`required` 會在標籤後加紅色星號（`danger`）。
