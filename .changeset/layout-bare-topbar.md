---
'@seanyeh77/ui': minor
---

AppShell 沒有 `title`、`tags`、`actions`、`onSearch` 時（詳細頁的標題在 PageHeader）不畫頂部列，內容從最上方開始，不再留一條 64 px 的空白列；平板仍有頂部列放選單按鈕。PageHeader 的 `meta` 可以給陣列，以「 · 」連起來，全形「）」後面不加空格；字串的 `meta` 也照這個規則調整，日期的「）」和時間之間不留空格。
