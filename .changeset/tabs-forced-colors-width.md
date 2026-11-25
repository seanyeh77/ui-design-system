---
'@seanyeh77/ui': patch
---

Tabs：強制色彩模式下選中的底線用 `Highlight`、基準線用 `CanvasText` 框線，不再消失（SettingsLayout 手機版的分頁列也是）；基準線一律跨滿容器寬度。SettingsLayout 手機版分頁列和內容的間距改為 `space-4`；切換分類時瀏覽器拒絕改網址（sandbox 的 iframe）也不會出錯。LayerGraph 的「圖／清單」改用 SegmentedControl（同一份內容的兩種顯示方式）。Tabs 的說明：帶筆數的篩選摘要一律用 DataTable 的 `summary`。
