---
'@seanyeh77/ui': patch
'@seanyeh77/ui-cli': patch
---

DataTable：`loading` 時 `relative` 欄的載入條和 `dateTime` 同寬（184 px），資料載入後欄寬不再跳動；手機卡片在第一欄是 `mono` 的 ID 時，改用第一個非 `mono` 欄當標題，ID 變成一行欄位。TextField：點前綴、後綴或單位文字會聚焦輸入框。`ui check`：file:// 頁面的字型被 CORS 擋下時不算 console 錯誤，改成一行 note，提醒用 http 開頁面才載得到字型。
