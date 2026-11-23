# @seanyeh77/tokens

SeanYeh 設計系統的設計 token：淺色、深色和 `teaching` 預設的 CSS 變數（`tokens.css`）、Tailwind v4 主題（`tailwind.css`）、有型別的 token 名稱（`cssVar()`）和自架字體。

## 安裝

```bash
npm i @seanyeh77/tokens
```

用 `@seanyeh77/ui` 時不必另外裝：它已經帶 `tokens.css` 和字體。只有要用 `cssVar()` 或 Tailwind 主題時才需要這個套件。

```ts
import { cssVar } from '@seanyeh77/tokens';

const style = { color: cssVar('ink-muted') }; // 只有存在的 token 名稱能編譯
```

```css
@layer theme, base, ui, components, utilities;
@import 'tailwindcss';
@import '@seanyeh77/tokens/tailwind.css';
```

## 文件

- 文件網站：<https://seanyeh77.github.io/ui-design-system/>（全部 token 見 `theme.md`）
- 給 AI agent 的使用說明：[AGENTS.md](https://github.com/seanyeh77/ui-design-system/blob/main/AGENTS.md)
