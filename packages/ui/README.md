# @seanyeh77/ui

SeanYeh 設計系統的 React 19 元件：有型別的 ES module，浮層（Dialog、Menu、Popover、Select…）建在 Base UI 上，樣式只用設計 token。套件也帶 `tokens.css`、自架字體、給沒有 build step 頁面用的 `bundle.js`，以及每個元件的 README 和使用規則（`docs/`）。

## 安裝

```bash
npm i react react-dom @seanyeh77/ui
```

## 使用

載入三個 CSS，啟動時呼叫一次 `initTheme()`（套用使用者存下的主題與強調色）：

```ts
import '@seanyeh77/ui/fonts.css';
import '@seanyeh77/ui/tokens.css';
import '@seanyeh77/ui/styles.css';
import { Button, initTheme } from '@seanyeh77/ui';

initTheme();

export const Save = () => <Button variant="primary">儲存</Button>;
```

樣式在 cascade layer `ui` 裡：頁面自己沒放進 layer 的 CSS 一定蓋過元件，所以重設 CSS 要放進 `@layer base`，專案範本附的 `index.css` 要刪掉。只載入用到的元件的 CSS（`@seanyeh77/ui/css/`）見 `docs/theme.md`。

## 文件

- 文件網站（每個元件的範例與屬性表）：<https://seanyeh77.github.io/ui-design-system/>
- 給 AI agent 的使用說明：[AGENTS.md](https://github.com/seanyeh77/ui-design-system/blob/main/AGENTS.md)
- 套件內：`node_modules/@seanyeh77/ui/docs/`（`guidelines.md` 是每個頁面都要遵守的規則）
