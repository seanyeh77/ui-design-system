# @seanyeh77/eslint-plugin-ui

## 0.48.2

No changes in this release.

## 0.48.1

No changes in this release.

## 0.48.0

### Patch Changes

- 8c8aeea: codemap 回報的五項修正：
  
  - Workbench：`views` 或 `defaultLayout` 每次繪製都是新陣列時不再無限重繪（React #185）。版面只看 view 的 `id` 和 `defaultLayout` 的內容；`onLayoutChange` 只在版面內容改變時呼叫，可以直接傳 state 的 setter；分頁列的指示線位置不變時不再更新。
  - Workbench：桌面下方面板上緣的邊界點擊範圍往上延伸到 24 px（WCAG 2.5.8），不蓋住面板的分頁列。
  - 新增 `useFilePicker({ accept, multiple, onPick })`，回傳 `{ open }`：從 Button 的 `onClick` 或 Menu 項目的 `onSelect` 打開檔案選擇，hook 自己管隱藏的 `<input type="file">`。
  - `no-native-controls`：有 `hidden` 屬性的 `<input>` 不算；`<input type="file">` 的訊息提到 `useFilePicker`。
  - `ui check`：句子裡的 Term（`variant="inline"`，或旁邊有文字的預設樣式）和句子裡的連結一樣不算觸控目標，旁邊的文字在其他元素裡也一樣；「卡片外的文字」用 `overflow` 是 `hidden` 或 `clip` 的元素裁過、看得到的範圍量，`text-overflow: ellipsis` 截斷的文字不再被回報。

## 0.47.2

No changes in this release.

## 0.47.1

No changes in this release.

## 0.47.0

No changes in this release.

## 0.46.0

### Patch Changes

- 4872187: `verb-labels` 不再把「送出」「Submit」當成不說明動作的文字；訊息列出可以改用的字。

## 0.45.0

### Minor Changes

- 367948e: `no-native-controls` 也擋 `<textarea>`、`<button>`（用 Button 或 IconButton）、`<a>`（用 Link）和沒有 type 或 type 為 text、search、email、password、number、range 的 `<input>`，可以用 `allow` 選項放行，例如 `['error', { allow: ['a'] }]`；帶 `ui-` 開頭 class 的原生元素不算。`danger-confirm` 和 `one-primary-button` 也看條件式的 `variant`（`variant={x ? 'danger' : 'quiet'}`）。新規則 `no-raw-size`（recommended 裡是 warn）：style 裡寫死的間距、字級、字體、圓角、陰影和 Tailwind 任意值（`text-[13px]`）改用 token。TSX parser 打包進套件，套件只依賴 ESLint，TypeScript 7 專案也能安裝。升級方式：原本的 `<a>`、`<button>`、`<input>` 改用元件，或在設定加上 `allow`；為了 TypeScript 7 另外裝的 `typescript@npm:@typescript/typescript6` 可以移除。

## 0.44.0

No changes in this release.

## 0.43.1

No changes in this release.

## 0.43.0

No changes in this release.

## 0.42.0

### Patch Changes

- fb81a5d: 分檔 CSS 修正：每個 `css/<Name>.css` 都帶齊它需要的其他元件的檔（DatePicker 帶 Calendar、IconButton 帶 Tooltip、Button 帶 Dialog 等），需要的檔排在後面時 build 直接失敗；`LineChart`、`TextField` 等沒有自己樣式的元件也有 `css/<Name>.css`。`styles.css` 的規則順序跟著調整，畫面不變。`backdrop-filter` 與 `user-select` 的 `-webkit-` 寫法移到標準屬性之前，bundler 壓縮後不再丟掉背景模糊。`ui check` 新增一項：列出頁面沒放進 cascade layer、用元素或 `*` 選擇器、又蓋過元件宣告的 CSS（重設 CSS、範本附的 `index.css`）。每個套件加上 README。

## 0.41.0

No changes in this release.

## 0.40.0

No changes in this release.

## 0.39.0

No changes in this release.

## 0.38.0

No changes in this release.

## 0.37.0

No changes in this release.

## 0.36.0

No changes in this release.

## 0.35.0

No changes in this release.

## 0.34.0

No changes in this release.

## 0.33.0

No changes in this release.

## 0.32.0

No changes in this release.

## 0.31.0

No changes in this release.

## 0.30.1

No changes in this release.

## 0.30.0

No changes in this release.

## 0.29.0

No changes in this release.

## 0.28.0

No changes in this release.

## 0.27.0

No changes in this release.

## 0.26.0

No changes in this release.

## 0.25.0

No changes in this release.

## 0.24.0

No changes in this release.

## 0.23.0

No changes in this release.

## 0.22.0

No changes in this release.

## 0.21.0

No changes in this release.

## 0.20.0

No changes in this release.

## 0.19.0

No changes in this release.

## 0.18.0

No changes in this release.

## 0.17.0

No changes in this release.

## 0.16.0

No changes in this release.

## 0.15.0

No changes in this release.

## 0.14.0

No changes in this release.

## 0.13.0

No changes in this release.

## 0.12.1

No changes in this release.

## 0.12.0

No changes in this release.

## 0.11.0

No changes in this release.

## 0.10.0

No changes in this release.

## 0.9.0

No changes in this release.

## 0.8.1

No changes in this release.

## 0.8.0

No changes in this release.

## 0.7.1

No changes in this release.

## 0.7.0

No changes in this release.

## 0.6.1

No changes in this release.

## 0.6.0

No changes in this release.

## 0.5.0

No changes in this release.

## 0.4.1

No changes in this release.

## 0.4.0

No changes in this release.

## 0.3.0

### Minor Changes

- 9e7a950: Breaking: DataTable `format: 'percent'` no longer adds the % sign; add `unit: '%'` (as KpiCard). Rows hidden by filters, search, views or the summary are unchecked, so `bulkActions` only gets visible rows. Drawer `actions` can be `(requestClose) => …` so the footer 取消 asks before discarding changes. A collapsed SideNav parent opens its first page. Every check box uses the same drawn check, drawn only when it turns on.
  
  New ESLint rule `ui/no-tailwind-defaults` (error in `recommended`): Tailwind's own palette, radii and shadows, in className and in cn()/clsx()/cva() calls.
