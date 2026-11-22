# TextField

## 用法

單行文字輸入，標籤在上、說明或錯誤在下；其他屬性照原生 `<input>`。多行用 TextArea，搜尋用 SearchField。

```tsx
<TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={emailError} />
```

- 標籤一定要有，不要只靠 placeholder。
- 錯誤：`error` 給一句原因加修正方式（「Email 格式不正確，例如 name@example.com」）。
- 必填：`required` 會在標籤後加紅色星號（`danger`）。

## 細節

- 外框樣式：`surface-input` 底色、`line-strong` 邊框、`radius-md`。
- focus：邊框變 `accent` 並加 3 px `focus-ring` 光暈。
- 錯誤時邊框變 `danger`，欄位內右側出現警示圖示，訊息用 `danger-text`。輸入框帶 `aria-invalid` 與 `aria-describedby`；錯誤訊息是 `role="alert"`，出現時會被念出。
- 停用：`surface-sub` 灰底、`ink-muted` 灰字、無邊框。
