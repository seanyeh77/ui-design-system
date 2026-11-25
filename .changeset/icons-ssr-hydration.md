---
'@seanyeh77/ui': patch
---

Icon：server render 和 hydrate 只用 `preloadIcons` 載入過的圖示。server 匯入整個套件、瀏覽器只打包用到的模組時，兩邊的 markup 一樣，不再 hydrate 失敗（React #418）；元件固定的圖示在 hydrate 後立即補上。有 server render 的頁面要讓首屏圖示出現在 server 的 HTML 裡，就在 server 和瀏覽器 await 同一組 `preloadIcons`。
