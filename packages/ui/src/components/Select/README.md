# Select

## 用法

下拉選單，從清單選一個。一律不用瀏覽器原生 `<select>`。選多個用 MultiSelect；選項要全部攤開時用 RadioGroup。

```tsx
<Select
  label="環境"
  value={env}
  onChange={setEnv}
  options={[
    { value: 'prod', label: '正式環境' },
    { value: 'staging', label: '測試環境' },
  ]}
/>
```

- 依內容決定類型：選項超過 8 個時自動加上搜尋框，8 個以內是一般自訂選單；用 `searchable` 可手動指定。
- 選單向下展開（200 ms），按 Esc 關閉；選中項目用 `accent-soft` 底加勾。
- 搜尋沒有結果時只顯示一句話：「找不到符合的選項」。
- 有錯誤時給 `error`（原因加修正方式）：紅框、框內箭頭前的警告圖示，下方寫錯誤，出現時念一次。
