---
'@seanyeh77/ui': minor
'@seanyeh77/tokens': minor
---

樣式改放在 cascade layer `ui` 裡（`tokens.css` 在 `ui.tokens`，`styles.css` 在 `ui.components`）：頁面不加 layer 的 CSS 一定蓋過元件與 token，不必比 specificity 或加 `!important`。兩個檔案開頭宣告 `@layer theme, base, ui, components, utilities;`，配合 Tailwind v4 時 utility class 可蓋過元件、preflight 不會蓋掉元件（在主要 CSS 檔最前面寫同一行即可不受載入順序影響）。原本靠 layer 放自己規則的頁面：排在 `ui` 之前的 layer 現在會輸給元件。元件 CSS 的 `!important` 宣告比頁面沒有 layer 的 `!important` 優先。

ES module 改為一個原始模組一個檔案，bundler 只留下頁面 import 的元件；`'use client'` 在每個元件模組開頭，`@seanyeh77/ui/format` 仍不含 `'use client'`。新增 `@seanyeh77/ui/css/<Name>.css` 分檔：先載入 `css/base.css`、再載入用到的元件、最後 `css/end.css`，只用 Button 時 CSS 從約 148 KB（gzip 25 KB）降到約 14 KB（gzip 3.6 KB）。`styles.css` 仍是預設載法，畫面不變（75 個預覽頁在 390 px、1280 px 亮暗共 300 張截圖與改動前相符）。
