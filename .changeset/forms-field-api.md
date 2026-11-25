---
'@seanyeh77/ui': minor
---

表單欄位的 API 統一（破壞性變更，改法如下）：

- `TextField` 的 `onChange` 改成 `onChange(value, event)`，第一個參數是新的文字。改法：`onChange={(e) => setName(e.target.value)}` 改成 `onChange={setName}`；需要事件時用第二個參數 `onChange={(v, e) => …}`。`TextArea` 也多了第二個參數 `event`。
- 新的共用型別 `FieldProps`：`label`（必填）、`hideLabel`、`hint`、`error`、`required`、`disabled`、`name`。`TextField`、`TextArea`、`Select`、`MultiSelect`、`DatePicker`、`DateRangePicker` 都用它，所以這些元件的 `label` 變成必填。改法：沒有標籤的欄位加上 `label="…"`，看不到標籤時加 `hideLabel`；`Select` 原本只給 `aria-label` 的改成 `label="…" hideLabel`（`aria-label` 仍可用一個版本，開發模式提醒）。
- `DateRangePicker` 的 `value` 與 `onChange` 改成 `[Date | null, Date | null]`，「清除」會送出 `[null, null]`；型別 `DateRange` 也是這個。改法：`onChange` 的處理函式接受 `null`。新增 `hint`、`error`、`required`、`disabled`、`name`；日曆圖示移到右邊，按鈕名稱包含畫面上的日期文字（WCAG 2.5.3）。
- `DatePicker` 新增 `disabled`、`name`、`hideLabel`；在 `FormGrid` 裡寬度填滿欄位。`MultiSelect` 新增 `hint`、`required`、`disabled`、`name`，「+n」念成「另外 n 個：…」。`TextArea` 的字數連到 `aria-describedby`，打到上限時念「已達 n 字上限」。`TextField` 保留你自己給的 `aria-describedby` 與 `aria-invalid`。
- `Checkbox`、`Switch`、`RadioGroup` 可以不受控：`defaultChecked`、`defaultValue`；`onChange` 多了第二個參數 `event`；新增 `name`。`Checkbox` 與 `RadioGroup` 一定要有 `label` 或 `aria-label`（型別檢查）。改法：沒有文字的 `<Checkbox />` 加 `aria-label`。
- `SegmentedControl` 改用 `options: { value, label, icon }[]`，和 Select、RadioGroup 相同；`items: { id, … }[]` 仍可用一個版本，開發模式提醒。高度改成 40 px（Workbench 的 `mainBar` 裡維持 28 px），觸控裝置 48 px；只有圖示時選中的圖示用 `ink` 色。
- `Calendar` 的 `focus` 改名 `month`（值改變時月曆跟著換頁）與 `defaultMonth`，新增 `onMonthChange`；`focus` 仍可用一個版本。
- `AccentPicker` 與 `ThemePicker` 有看得見的標籤（「強調色」「主題」）；色碼欄位改成離開欄位或按 Enter 時才檢查，錯誤與提示連到 `aria-describedby`。
- `FormGrid` 改用 container query：FormGrid 自己寬 640 px 以上才雙欄，放在 400 px 的 Drawer 裡維持單欄。FormGrid 裡多了一層 `.ui-formgrid-in`，自己的 CSS 選 `.ui-formgrid > *` 的要改成 `.ui-formgrid-in > *`。
- 新增 `useFormErrors(values, validate)`：離開欄位與送出時才顯示錯誤，送出時焦點移到第一個有錯的欄位。
- `LoginCard`：外層改成 `<main>`，底色 `bg`、最小高度 100dvh；送出有錯時焦點移到第一個有錯的欄位，錯誤不再同時用兩個 `role="alert"`；「顯示密碼」名稱固定，只改 `aria-pressed`；新增 `logo`。
- 選項的文字一律 15 px（`text-control`），Switch 旁 `<label>` 裡的文字也是。
- `Term variant="inline"`：鍵盤 focus 不再自動打開說明，按 Enter 或點一下才打開；要舊的行為時加 `openOnFocus`。
- Checkbox 與 Switch 在強制色彩模式（Windows 高對比）下用系統色，勾、橫線與圓鈕不再消失。
