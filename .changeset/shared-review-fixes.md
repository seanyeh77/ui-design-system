---
'@seanyeh77/ui': minor
'@seanyeh77/tokens': minor
---

放在 `Card` 或 `DataTable` 裡的 Badge 不論寬度都自動變成圓點加文字、沒有陰影，圓點樣式只有失敗、審核中、進行中用狀態色，完成與草稿用 `ink-muted`；Button 新增 `variant="quiet"`（無外框、`ink-muted` 文字、滑過 `surface-sub` 底色）；新增 `radius-xs` 4 px 給行內程式碼、Term、按鍵與 SegmentedControl，Tabs 指示塊與分頁改用 `radius-sm`，所有膠囊圓角改用 `radius-full`；深色 `shadow-chip` 變淡、`surface-chrome` 調亮為 `#3d3834`、`accent-soft` 改為 `surface` 混入 22% 強調色（`#343c55`，`setAccent` 同步），`line-strong` 深色調亮為 `#988c80`，兩個主題在 `surface` 與 `surface-sub` 上都達 3:1；8 個推薦強調色在淺色主題本身就達 4.5:1，未達標的 6 個改深（紫 `#864ad1`、桃紅 `#ba3873`、紅 `#c53228`、橘 `#ab5101`、綠 `#077b42`、青 `#027874`），教材主題的強調色隨之改為 `#027874`；SearchField 清除鈕、`ui-link-btn`、SideNav 的圖釘與收合按鈕有 Focus 外光暈，圖釘與收合按鈕改用右側 Tooltip；Tooltip 新增 `side="right"`；TextField 的錯誤訊息改為 `role="alert"`，LoginCard 的帳號錯誤因此和密碼錯誤一樣會被念出，「忘記密碼？」改為「忘記密碼」；Grid 的說明改為實際的欄數變化。
