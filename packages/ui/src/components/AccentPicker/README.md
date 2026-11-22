# AccentPicker

## 用法

強調色選擇：8 個推薦色票，下方可以輸入任何色碼；放在設定頁的「外觀」，和 ThemePicker 放在一起。

```tsx
<SettingsSection title="外觀">
  <ThemePicker />
  <AccentPicker />
</SettingsSection>
```

- 不傳 `onChange` 時直接呼叫 `setAccent()`，重新算出所有強調相關 token 並存在 localStorage；頁面載入時呼叫一次 `initTheme()` 套用。
- 不放在頂部列。
- 選很淺或很深的顏色時，文字色 `accent-text` 自動加深或調亮；填色仍是選的顏色。

## 細節

- 色票：藍、靛、紫、桃紅、紅、橘、綠、青；選中的色票外圍一圈同色外框並打勾。
- 色碼欄位：輸入 # 加 6 碼就立即套用；格式不正確時框變紅並說明。
- 換算方式見 theme.md 的「自訂強調色的換算」（`ui docs theme`）：填色、hover、按下、淺底、文字色與焦點外框（`focus`）都由強調色算出；填色在深色主題會調亮到 3:1。
- 文字一定讀得清楚：選了很淺（淺色主題）或很深（深色主題）的強調色時，`accent-text` 會自動加深或調亮，直到對 `bg` 與 `surface` 都有 4.5:1，例如淺色主題選 `#ffe066` 時連結、選中的分頁文字變成 `#7a6c31`。按鈕、進度條、選取框這些填色仍是選的顏色；按鈕上的字由 `on-accent` 選白色或深色。
