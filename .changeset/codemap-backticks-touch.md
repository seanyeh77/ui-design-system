---
'@seanyeh77/ui': patch
---

修正 codemap 升級後回報的三個問題：

- Workbench：手機上下方面板的拖曳把手在觸控螢幕上有 48 px 高的觸控範圍（看得到的部分仍是 20 px，往上延伸一塊透明範圍，不蓋住下面的分頁列），`ui check` 不再回報 `Panel height 390 x 20 px`。
- ProjectSwitcher：「專案 · 狀態」的「·」前面少了空格（顯示成「audio-demo· 即時」），現在兩邊各一個空格。
- 收字串的說明 prop 把反引號裡的文字顯示成行內程式碼（InlineCode），不顯示反引號；只有一個反引號時照原樣顯示。適用：EmptyState 的 `description`、`steps`，SettingsSection 的 `description`，TextField、TextArea、DatePicker 的 `hint`、`error`，Select、MultiSelect、LoginCard、FileUpload 檔案的 `error`，Alert、Toast、Dialog 字串內容，Drawer 的 `confirmText`，DangerZone、ErrorPage 的 `description`，EventTimeline 事件的 `text`，KpiCard 的 `target`、`verdict.text`，NotificationBell 通知的 `body`（Term 的 `text` 原本就支援）。CodeText 和 LayerGraph 標籤改用同一個解析函式；CodeText 開頭單獨一個反引號時不再被當成程式碼。
