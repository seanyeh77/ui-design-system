---
'@seanyeh77/ui': patch
'@seanyeh77/tokens': patch
---

AppShell：頁面本身不再捲動。內容捲動區（`.ui-shell-main`）是絕對定位內容的定位框，圖表的隱藏資料表、KpiCard 念出的數值、外部連結的隱藏說明不再把文件撐高（390 px 時文件從 844 px 長到 1734 px，捲下去一片空白）；`.ui-visually-hidden` 加上 `clip-path: inset(50%)`。0.45.1 恢復導覽的平板邊界含 1024 px：600 到 1024 px 用導覽抽屜，大於 1024 px 才有側邊欄（0.45.0 誤改成 1023 px）。
