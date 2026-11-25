---
'@seanyeh77/ui': patch
---

DataTable 換頁或篩選時淡出的舊列複本設為 `inert`，裡面的連結與按鈕不能取得焦點，也不重複表格裡的 id，動畫期間不再違反 axe 的 aria-hidden-focus 規則。
