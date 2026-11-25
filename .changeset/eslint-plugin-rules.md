---
'@seanyeh77/eslint-plugin-ui': minor
---

`no-native-controls` 也擋 `<textarea>`、`<button>`（用 Button 或 IconButton）、`<a>`（用 Link）和沒有 type 或 type 為 text、search、email、password、number、range 的 `<input>`，可以用 `allow` 選項放行，例如 `['error', { allow: ['a'] }]`；帶 `ui-` 開頭 class 的原生元素不算。`danger-confirm` 和 `one-primary-button` 也看條件式的 `variant`（`variant={x ? 'danger' : 'quiet'}`）。新規則 `no-raw-size`（recommended 裡是 warn）：style 裡寫死的間距、字級、字體、圓角、陰影和 Tailwind 任意值（`text-[13px]`）改用 token。TSX parser 打包進套件，套件只依賴 ESLint，TypeScript 7 專案也能安裝。升級方式：原本的 `<a>`、`<button>`、`<input>` 改用元件，或在設定加上 `allow`；為了 TypeScript 7 另外裝的 `typescript@npm:@typescript/typescript6` 可以移除。
