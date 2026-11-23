---
'@seanyeh77/ui': minor
---

圖示改為按需載入：每個圖示是一個獨立模組，有 build 的專案只打包頁面用到的圖示（只用 Button 時 JS 從 357 KB 降到 303 KB），`<Icon name>`、`icon` 屬性、`IconName`、`icons` 與 `bundle.js` 的用法都不變。元件固定顯示的圖示隨元件打包、立即顯示；其他名稱第一次顯示時載入，載入前是同樣大小的空白方框。新增選用的 `preloadIcons()`，讓首屏圖示在第一次畫面就出現；`name` 不是內建名稱時有開發警告。
