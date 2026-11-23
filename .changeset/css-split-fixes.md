---
'@seanyeh77/ui': patch
'@seanyeh77/ui-cli': patch
'@seanyeh77/tokens': patch
'@seanyeh77/eslint-plugin-ui': patch
---

分檔 CSS 修正：每個 `css/<Name>.css` 都帶齊它需要的其他元件的檔（DatePicker 帶 Calendar、IconButton 帶 Tooltip、Button 帶 Dialog 等），需要的檔排在後面時 build 直接失敗；`LineChart`、`TextField` 等沒有自己樣式的元件也有 `css/<Name>.css`。`styles.css` 的規則順序跟著調整，畫面不變。`backdrop-filter` 與 `user-select` 的 `-webkit-` 寫法移到標準屬性之前，bundler 壓縮後不再丟掉背景模糊。`ui check` 新增一項：列出頁面沒放進 cascade layer、用元素或 `*` 選擇器、又蓋過元件宣告的 CSS（重設 CSS、範本附的 `index.css`）。每個套件加上 README。
