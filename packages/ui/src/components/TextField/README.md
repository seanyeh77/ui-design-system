# TextField

## 用法

單行文字輸入，標籤在上、說明或錯誤在下；其他屬性照原生 `<input>`。多行用 TextArea，搜尋用 SearchField。

```tsx
<TextField label="Email" type="email" required value={email} onChange={setEmail} error={emailError} />
```

- `onChange(value, event)`：第一個參數是新的文字，可以直接給 `setEmail`（舊版收到的是原生事件，見 CHANGELOG 的改法）。
- 標籤一定要有，不要只靠 placeholder；不需要看到標籤時（工具列的搜尋）加 `hideLabel`，螢幕閱讀器仍念得到。
- 自己給的 `aria-describedby`、`aria-invalid` 會保留，和提示或錯誤合在一起。
- 錯誤：`error` 給一句原因加修正方式（「Email 格式不正確，例如 name@example.com」）。離開欄位（blur）或送出表單時才設定，不在每次按鍵時設定；改正後立刻清掉。欄位多時用 `useFormErrors` 處理這些時機。
- 必填：`required` 會在標籤後加紅色星號（`danger`）。
- `hint` 與 `error` 裡反引號包住的文字顯示成行內程式碼（InlineCode），不顯示反引號。

## 細節

- 外框樣式：`surface-input` 底色、`line-strong` 邊框、`radius-md`。
- focus：2 px `focus` 實線外框（間隔 2 px），和其他控制項相同；邊框不變色。
- 錯誤時邊框變 `danger`，欄位內右側出現警示圖示，訊息用 `danger-text`。輸入框帶 `aria-invalid` 與 `aria-describedby`；錯誤訊息只在有錯誤時才放進頁面，是 `role="alert"` 的新節點，出現時念一次；同一句錯誤重新渲染不再念，換成另一句時念新的一句。說明（`hint`）是另一個節點，不會被念出。
- 停用：`surface-sub` 灰底、`ink-muted` 灰字、無邊框。
