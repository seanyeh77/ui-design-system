# @seanyeh77/eslint-plugin-ui

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
