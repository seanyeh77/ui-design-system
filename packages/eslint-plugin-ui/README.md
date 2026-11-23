# @seanyeh77/eslint-plugin-ui

讓用 `@seanyeh77/ui` 寫的程式碼守住設計系統規則的 ESLint 規則：只用 token 顏色（`no-raw-color`、`no-tailwind-defaults`）、用元件取代原生控制項（`no-native-controls`）、卡片裡不再放卡片（`no-nested-card`）、每區最多一個主要按鈕（`one-primary-button`）、按鈕文字用動詞（`verb-labels`）、危險動作要確認（`danger-confirm`）。

## 安裝

```bash
npm i -D @seanyeh77/eslint-plugin-ui
```

```js
// eslint.config.js
import ui from '@seanyeh77/eslint-plugin-ui';

export default [ui.configs.recommended];
```

設定用 typescript-eslint 的 parser 讀 `.tsx`，需要 `typescript` 5 或 6 的 API；只裝了 TypeScript 7 時，另外安裝 `typescript@npm:@typescript/typescript6` 當 dev dependency。

## 文件

- 文件網站：<https://seanyeh77.github.io/ui-design-system/>
- 給 AI agent 的使用說明：[AGENTS.md](https://github.com/seanyeh77/ui-design-system/blob/main/AGENTS.md)
