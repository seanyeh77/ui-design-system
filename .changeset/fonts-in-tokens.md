---
'@seanyeh77/ui': minor
'@seanyeh77/tokens': patch
---

字型檔只放在 `@seanyeh77/tokens`：`@seanyeh77/ui` 改成依賴它（安裝時自動一起裝），`@seanyeh77/ui/fonts.css` 改成 `@import '@seanyeh77/tokens/fonts.css'`，由 bundler 解析（Vite、webpack、Next.js 都可以），套件從約 12 MB 降到約 1 MB；`dist/bundle.js.map` 不再放進套件。升級方式：用 bundler 的專案不必改；在瀏覽器直接載入 `node_modules/@seanyeh77/ui/dist/fonts.css` 或從 CDN 載入 `@seanyeh77/ui/dist/fonts.css` 的頁面，改載入 `@seanyeh77/tokens/fonts.css`，或用文件網站固定版本的 `/dist/<版本>/fonts.css`。
