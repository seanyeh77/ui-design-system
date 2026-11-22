# TextArea

## 用法

多行輸入。單行用 TextField。

```tsx
<TextArea label="說明" value={note} onChange={setNote} maxLength={200} />
```

- 隨內容自動長高，從 3 行開始，最多 8 行，之後在框內捲動。
- 右下角顯示字數 `n / 200`（等寬字）；`maxLength` 可改上限。螢幕閱讀器念「200 字中的 n 字」。
- 在 FormGrid 裡加 `className="is-full"` 跨滿兩欄。
- 有錯誤時給 `error`：紅框、框內右上角的警告圖示，錯誤取代下方的提示，出現時念一次。

## 細節

- 樣式與 TextField 相同；`required` 加紅色星號。
