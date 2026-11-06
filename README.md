# 前端設計系統

一套 React 元件、設計 token、頁面範本和使用規則：暖灰中性色、強調色 `#2457d6`，字體 Inter 加思源黑體，數字用 Geist Mono，有淺色與深色主題。

文件網站可以直接操作每個元件，並列出每個屬性：<https://seanyeh77.github.io/ui-design-system/>

## 使用方式

有 build step 的專案（Vite、Next.js）：

```ts
import '@seanyeh77/ui/fonts.css';
import '@seanyeh77/ui/tokens.css';
import '@seanyeh77/ui/styles.css';
import { Button, initTheme } from '@seanyeh77/ui';

initTheme();
<Button variant="primary">儲存</Button>;
```

沒有 build step 的頁面，一個 script 就包含 React 19 和全部元件：

```html
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/fonts.css">
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/tokens.css">
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/styles.css">
<script src="https://seanyeh77.github.io/ui-design-system/dist/bundle.js"></script>
<script>
  UI.initTheme();
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(UI.Button, { variant: 'primary' }, '儲存'));
</script>
```

- 主題：`setTheme('light' | 'dark' | 'auto')`，強調色：`setAccent('#2457d6')`。
- 介面文字：`setLocale('en')` 切成英文，`addMessages(locale, dict)` 加其他語系。
- 日期與數字：`format`，例如 `format.relative(date)`、`format.money(1280)`、`format.fileSize(bytes)`。
- 頁面範本：`npx shadcn@latest add https://seanyeh77.github.io/ui-design-system/r/dashboard.json`（另有 `list-detail`、`settings`、`login`）。

## 給 AI agent

使用規則寫在 [AGENTS.md](AGENTS.md)（`CLAUDE.md` 會引用它）。文件網站另外提供 <https://seanyeh77.github.io/ui-design-system/llms.txt>，列出所有規則、元件說明和範本的網址。寫錯的用法大多在型別檢查、`@seanyeh77/eslint-plugin-ui` 或 `npx ui check` 就會被擋下。

## 內容

| 路徑 | 內容 |
| --- | --- |
| `packages/ui` | 元件（`@seanyeh77/ui`）：每個元件一個資料夾，有 TSX、說明、Storybook 範例和預覽 |
| `packages/tokens` | `tokens.json`（色彩、字體、間距、圓角、陰影、尺寸）和產生的 CSS、Tailwind 設定、字型 |
| `packages/blocks` | 頁面範本，透過 `registry.json` 發佈成 shadcn registry |
| `packages/eslint-plugin-ui` | 檢查設計規則的 ESLint 規則 |
| `packages/cli` | `ui check`：手機寬度、觸控範圍、卡片裡的卡片等自動檢查 |
| `apps/docs` | Storybook 文件網站 |
| `docs/` | 設計規則、版面、動畫與決策紀錄 |
| `labs/` | 實驗室的選項頁面 |

## 開發

```bash
pnpm install
pnpm check      # build、型別、lint、測試
pnpm site       # 文件網站輸出到 site/
```
