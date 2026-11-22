# 表單

欄位的外觀和行為由元件處理；這裡是選哪個元件、怎麼排。

## 選哪個元件

| 要輸入的 | 元件 |
|---|---|
| 一行文字、Email、密碼 | `TextField` |
| 多行文字 | `TextArea`（顯示字數，最多長到 8 行） |
| 搜尋 | `SearchField` |
| 從清單選一個 | `Select`（選項超過 8 個自動加搜尋框）；選項要全部攤開在畫面上時用 `RadioGroup` |
| 從清單選多個 | `MultiSelect`；名稱、標籤這類使用者自由增加的才開 `creatable`，狀態、權限這類固定清單不開 |
| 勾選 | `Checkbox` |
| 是／否，立即生效 | `Switch` |
| 日期 | `DatePicker`（可以直接打 YYYY/MM/DD） |
| 日期範圍 | `DateRangePicker`（單一月曆加快捷範圍） |
| 檔案 | `FileUpload` |
| 強調色、主題 | `AccentPicker`、`ThemePicker` |

## 排列

- 標籤放在欄位上方，一定要有，不只靠 placeholder。
- 必填：標籤後加紅色星號（`required`）。
- 欄位排列依螢幕寬度：960 px（`bp-desktop`）以上雙欄，以下單欄，用 `FormGrid`；長欄位（例如多行輸入）跨滿兩欄。
- 按鈕與輸入框高度 40 px（`control-height`）。寬度小於 600 px 時，輸入框（文字、下拉、日期、密碼、多選）變成 48 px，整個框都是點擊範圍；按鈕外觀仍是 40 px。
- 錯誤寫在欄位下方：原因加修正方式。離開欄位（blur）或送出時才顯示，不在每次按鍵時顯示；打到一半不算錯，改正後錯誤立刻消失（和 DatePicker 一樣）。錯誤出現時念一次（`TextField` 只在有錯誤時插入 `role="alert"` 的節點）。
- 編輯一筆資料而不離開列表：`Drawer`，按鈕固定在底部，有未儲存的修改時關閉前先確認。
- 設定頁改完自動儲存，沒有「儲存」按鈕（`SettingsLayout`）。
