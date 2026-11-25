# DatePicker

## 用法

單一日期：可以直接輸入，也可以點右邊的日曆圖示選。日期範圍用 DateRangePicker；日曆要一直顯示在頁面上時用 Calendar。

```tsx
const [due, setDue] = useState<Date | null>(null);

<DatePicker label="到期日" value={due} onChange={setDue} required />;
```

- 格式 YYYY/MM/DD（不分語系），等寬字；打錯時框變紅並寫出正確格式，離開欄位後才顯示。
- 自己的檢查（例如必填）用 `error` 傳入，和格式錯誤一樣：紅框、日曆按鈕前的警告圖示，下方寫錯誤。
- `label` 必填（藏起來用 `hideLabel`），也接受 `disabled` 和 `name`（表單送出 `2026-11-14`）。在 FormGrid 裡寬度填滿欄位，單獨使用時寬 240 px。
- 日曆一週從週日開始；選中的日期是強調色圓角方塊，今天下方有一個小圓點。
- 手機上（寬度小於 600 px）日期格 48 px。

## 細節

- 打到一半（「2026/1」）不算錯；之後改成正確的日期時錯誤立刻消失。必填時輸入框有 `aria-required`。
- 打開日曆時焦點在選中的日期上，沒有值時在今天；方向鍵換日、PageUp／PageDown 換月。日曆下方有「今天」和「清除」；點外面或按 Esc 關閉。
