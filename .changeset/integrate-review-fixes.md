---
'@seanyeh77/ui': minor
'@seanyeh77/ui-cli': patch
---

全面審查修正的整合：

- AppShell 自動放一個 Toaster：AppShell 裡的頁面直接呼叫 `toast()`；頁面自己放了 `<Toaster />` 時改用頁面的。Toaster 還沒出現前呼叫的 `toast()` 會排隊，不再遺失。
- SettingsLayout 的 `toast` prop 改成 deprecated（開發時警告，仍可用）：改在儲存時呼叫 `toast('已儲存', { id: 'saved' })`。舊 prop 也經由 `toast()` 顯示，不再蓋住手機的分頁列。
- FileUpload 的 `status: 'error'` 改名為 `'danger'`；舊值仍可用，開發時警告。
- LoginCard 的「忘記密碼」改用 Link。觸控螢幕上清單選項與 DataTable 篩選的數字欄位至少 48 px；MultiSelect 打開清單時輸入框仍有名稱；DataTable 沒有資料時的 ARIA 表格結構完整；LineChart 資料表的「名稱（單位）」欄名有英文。
- 新字串的英文：DataTable 排序順序與欄寬調整、KpiCard 的「改善／變差」、圖表資料表的欄名。
- `ui check` 在頁面自己也跑 axe（Storybook 的無障礙 addon）時等它跑完，不再失敗。
