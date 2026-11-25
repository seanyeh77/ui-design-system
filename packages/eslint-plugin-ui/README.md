# @seanyeh77/eslint-plugin-ui

讓用 `@seanyeh77/ui` 寫的程式碼守住設計系統規則的 ESLint 規則：只用 token 顏色（`no-raw-color`、`no-tailwind-defaults`）、用元件取代原生控制項（`no-native-controls`）、卡片裡不再放卡片（`no-nested-card`）、每區最多一個主要按鈕（`one-primary-button`）、按鈕文字用動詞（`verb-labels`）、危險動作要確認（`danger-confirm`）、間距、字級、字體、圓角和陰影用 token（`no-raw-size`）。

## 安裝

```bash
npm i -D eslint @seanyeh77/eslint-plugin-ui
```

```js
// eslint.config.js
import ui from '@seanyeh77/eslint-plugin-ui';

export default [ui.configs.recommended];
```

設定用 typescript-eslint 的 parser 讀 `.jsx` 和 `.tsx`。這個 parser 和它需要的 TypeScript 6 API 已經打包在套件裡，套件只依賴 ESLint，所以專案用 TypeScript 5、6 或 7 都能安裝，也不會換掉專案的 `tsc`。

## 規則

| 規則 | 等級 | 擋下什麼 |
| --- | --- | --- |
| `no-raw-color` | error | style、`fill`、`stroke` 和 Tailwind `[…]` 裡寫死的顏色 |
| `no-tailwind-defaults` | error | Tailwind 自己的色盤、圓角和陰影（`bg-gray-100`、`rounded-xl`、`shadow-lg`） |
| `no-native-controls` | error | 系統有元件取代的原生元素：`<select>`、`<table>`、`<dialog>`、`<progress>`、`<textarea>`、`<button>`（用 Button 或 IconButton）、`<a>`（用 Link），以及沒有 type 或 type 為 text、search、email、password、number、range、checkbox、radio、date、file、color、submit 的 `<input>`。帶 `ui-` 開頭 class 的原生元素（`<button className="ui-link-btn">`）不算 |
| `no-nested-card` | error | Card 裡再放 Card |
| `danger-confirm` | error | 沒有 `confirm` 的危險按鈕，`variant={x ? 'danger' : 'quiet'}` 也算 |
| `one-primary-button` | warn | 同一區第二個主要按鈕，條件式的 `variant` 也算 |
| `verb-labels` | warn | 「確定」「OK」「是」這類只回答對話框、不說明動作的按鈕文字；「送出」「儲存」這類動詞可以 |
| `no-raw-size` | warn | style 的 padding、margin、gap、fontSize、borderRadius、boxShadow、fontFamily 寫死數值（`padding: 12`、`'0.75rem'`），以及 Tailwind 任意值（`text-[13px]`、`p-[7px]`）；`0`、`auto` 和 `var(--…)` 不算 |

專案自己用 router 的連結或其他原生元素時，用 `allow` 放行：

```js
export default [
  ui.configs.recommended,
  { rules: { 'ui/no-native-controls': ['error', { allow: ['a', 'input[type=range]'] }] } },
];
```

## 文件

- 文件網站：<https://seanyeh77.github.io/ui-design-system/>
- 給 AI agent 的使用說明：[AGENTS.md](https://github.com/seanyeh77/ui-design-system/blob/main/AGENTS.md)
