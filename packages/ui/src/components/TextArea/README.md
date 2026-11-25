# TextArea

## 用法

多行輸入。單行用 TextField。

```tsx
<TextArea label="說明" value={note} onChange={setNote} maxLength={200} />
```

- 隨內容自動長高，從 3 行開始，最多 8 行，之後在框內捲動。
- `onChange(value, event)`：第一個參數是新的文字。`label` 必填，要藏起來時加 `hideLabel`。
- 右下角顯示字數 `n / 200`（等寬字）；`maxLength` 可改上限。字數也連到輸入框的 `aria-describedby`，螢幕閱讀器念「200 字中的 n 字」；打到上限時念一次「已達 200 字上限」。
- 在 FormGrid 裡加 `className="is-full"` 跨滿兩欄。
- 有錯誤時給 `error`：紅框、框內右上角的警告圖示，錯誤取代下方的提示，出現時念一次。
- `hint` 與 `error` 裡反引號包住的文字顯示成行內程式碼（InlineCode），不顯示反引號。

## 細節

- 樣式與 TextField 相同；`required` 加紅色星號。
