---
'@seanyeh77/ui': patch
'@seanyeh77/ui-cli': patch
'@seanyeh77/tokens': patch
---

文件整理：

- AppShell 的導覽抽屜改在 600 到 959 px（原本到 1024 px），和斷點 token、Grid、SplitPane 的 960 px 一致；960 到 1024 px 的視窗現在有側邊欄。
- 套件的 `docs/` 多了 `agents.md`（做頁面的閱讀路徑）和 `icons.md`；`ui docs icons` 印出所有內建圖示名稱，`ui docs agents` 印出閱讀路徑。
- guidelines 補上常見頁面（清單、詳細、Dashboard、設定、表單）與狀態回饋（載入、失敗、空清單、Toast）的規則；每條規則只說一次。DataTable、LayerGraph、TreeList、Workbench、CodeView、Markdown 的 README 縮短，實作規格移到 repo 的 `docs/maintaining/`。
- 元件分組重新整理（`ui list`、llms.txt）：新增「版面與外框」「監控畫面」「程式碼與架構圖」「文字標記」，「頁面範本」改名「整頁元件」。`useFormErrors` 不再被 `ui docs` 當成指南。
- 每個匯出元件的 prop 都有一行 JSDoc（編輯器和 props 表格看得到）。
- tokens.json 的 `dur-toggle`、`dur-nav`、`space-5` 說明照實際用途改寫。
