---
'@seanyeh77/ui-cli': minor
'@seanyeh77/ui': patch
---

`ui check` 多檢查：被截斷又沒有 Tooltip 或 title 的介面文字、跑出卡片外的文字、1280 px 時小於 24 px 又擠著別的目標的目標（WCAG 2.5.8）、axe-core 的 WCAG 2.0、2.1、2.2 A 與 AA 規則（`--no-axe` 關掉），並自動點開分頁、SettingsLayout 分類和工具列選單檢查打開後的畫面（`--no-interact` 關掉；`--open <selector>` 加上自己的狀態）。頁面沒有 viewport meta 時只回報一次「缺 viewport meta」，不再把觸控目標算在元件頭上；整列可點的列連結（DataTable 的 `a.ui-dt-rowlink`）不算小目標。`ui check` 用和 `ui shots` 相同的 Chromium。`ui shots` 的整頁截圖包含 AppShell 主內容裡捲動的部分；網址的截圖檔名改用路徑加 hash，不含冒號，同一個網站的頁面不再互相覆蓋。`--help` 印出各指令的說明。`ui docs` 不加名稱時先印閱讀順序，`ui list` 依分組列出元件（`@seanyeh77/ui` 的 `docs/components.json` 提供分組）。升級方式：用網址產生的基準圖要重新產生（檔名改了）；新的檢查找出的問題要修，或暫時加 `--no-axe`、`--no-interact`。
