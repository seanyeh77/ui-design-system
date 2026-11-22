---
'@seanyeh77/ui': patch
'@seanyeh77/ui-cli': patch
---

`ui check` 新增兩項檢查：同一列工具列裡的控制項高度相差超過 1 px（例如「篩選」40 px、「欄位」32 px），以及表格列或卡片裡帶陰影的狀態標籤（`.ui-badge`）；兩項都寫出原因與修正方式。`docs/guidelines.md` 新增清單頁的做法（清單放在一張 Card，主要操作「新增」放在 Card 的 `actions`，筆數由表格工具列顯示）、按鈕層級（primary、secondary、quiet、danger）、表格與卡片裡的狀態圓點，以及時間長度格式（`46:42`、`1:54:49`）。`docs/data.md` 新增表格頁的規則：摘要已有筆數時不再用 KPI 卡片重複、要處理的狀態緊接在「全部」後面、摘要的欄位不再放進篩選、數字欄用 `numeric` 加 `unit`、失敗的列寫出原因並提供「重試」、執行中的進度寫在次要文字、列操作超過 2 個收進「⋯」、用 `rowHref` 打開一筆資料。`docs/motion.md` 的主題切換時間改為實際使用的 300 ms。
