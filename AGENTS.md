# AGENTS.md

For AI agents (Claude, Codex, Cursor and others) that build web pages with this design system. To change the design system itself, read [docs/maintaining.md](docs/maintaining.md).

SeanYeh's design system: typed React 19 components, design tokens, page templates and written rules. Docs site (Storybook, live examples, props tables): https://seanyeh77.github.io/ui-design-system/ ; index of every file: https://seanyeh77.github.io/ui-design-system/llms.txt

| Package | What it is |
| --- | --- |
| `@seanyeh77/ui` | The components, `styles.css`, `bundle.js` for pages without a build step, and the docs under `docs/` (this file is `docs/agents.md`) |
| `@seanyeh77/tokens` | `tokens.css`, the fonts, a Tailwind v4 theme (`tailwind.css`), typed token names with `cssVar()` |
| `@seanyeh77/eslint-plugin-ui` | Lint rules for the core rules |
| `@seanyeh77/ui-cli` | `ui check`, `ui shots`, `ui docs`, `ui list`, `ui add`. Run it as `npx @seanyeh77/ui-cli …`: plain `npx ui` is an unrelated package. |

## Building a page

Use it for any web page or tool UI unless the user asks for a different look. Spend the effort on the page's design and UX; do not write your own styles for something a component covers.

Read this, and nothing more:

1. `docs/guidelines.md`, the core rules every page needs (about 9 KB). Read it once, whole.
2. The 用法 block of each component you use: `npx @seanyeh77/ui-cli docs DataTable`. Add `--full` only for a detail the block does not cover. `ui list` lists every component by group; `ui docs icons` prints the icon names. The same files are in `node_modules/@seanyeh77/ui/docs/` and on the docs site under `/md/`.
3. A topic file only when the page has that topic: `layout`, `forms`, `data`, `monitoring`, `code`, `theme`, `motion` (`ui docs layout`).

Then:

- Start from a page template when one fits (`dashboard`, `list-detail`, `settings`, `login`): `npx @seanyeh77/ui-cli add dashboard [dir]` writes it with no network (default `src/components/blocks/dashboard/`). The same templates are a shadcn registry: `npx shadcn@latest add https://seanyeh77.github.io/ui-design-system/r/dashboard.json` (needs a `components.json`).
- Your own CSS uses tokens only: `var(--surface)` in CSS, `cssVar('ink-muted')` from `@seanyeh77/tokens` in style props, `bg-surface text-ink-muted` with the Tailwind theme.
- TypeScript enforces most rules: fix type errors instead of casting them away. In development the components warn in the console with the cause and the fix.
- Items marked 看情況 ("situational") are not fixed rules: choose per context and say which way you chose.
- Before you finish: `npx @seanyeh77/ui-cli check <file or URL>`. It opens the page at 390 px and 1280 px, light and dark, opens its tabs and menus, and fails on what the rules forbid and on axe-core WCAG 2.2 AA; each problem says what to fix. `--open <selector>` also checks a dialog or drawer. Add `--shots shots/` and check the screenshots against the last section of `guidelines.md`.

## Projects with a build step (Vite, Next.js and similar)

```bash
npm i react react-dom @seanyeh77/ui @seanyeh77/tokens
npm i -D eslint @seanyeh77/eslint-plugin-ui @seanyeh77/ui-cli
npx playwright install chromium   # the browser ui check uses; or set CHROMIUM_PATH
```

```ts
import '@seanyeh77/ui/fonts.css'; // the self-hosted fonts of @seanyeh77/tokens, resolved by the bundler: works offline
import '@seanyeh77/ui/tokens.css';
import '@seanyeh77/ui/styles.css';
import { AppShell, Button, DataTable, initTheme } from '@seanyeh77/ui';

initTheme(); // once, at startup: applies the stored theme and accent
```

```js
// eslint.config.js
import ui from '@seanyeh77/eslint-plugin-ui';
export default [ui.configs.recommended];
```

- `fonts.css` is about 500 KB of CSS (Noto Sans TC lists the characters of its 432 files). To keep it out of the CSS that blocks the first render, import `@seanyeh77/ui/fonts-latin.css` (Inter, Geist Mono; about 18 KB) instead and load the Chinese faces after the page with `import('@seanyeh77/ui/fonts-tc.css')` (a separate CSS file). Vite inlines font files under 4 KB; keep them as files with `build: { assetsInlineLimit: (f) => (f.endsWith('.woff2') ? false : undefined) }` in `vite.config`.
- ES modules only: TypeScript needs `moduleResolution` `bundler`, `node16` or `nodenext` (Vite and Next.js templates use `bundler`). React 19 is required. The module starts with `'use client'`; server code that only formats dates, numbers or text imports `@seanyeh77/ui/format`. Server-rendered pages put `themeScript` in an inline `<script>` in `<head>` so the stored theme and accent apply before the first paint (`theme.md`).
- The system's CSS is in the cascade layer `ui`: your unlayered CSS always wins. So delete the template's starter CSS (Vite's `index.css`, `App.css`) and put any reset in `@layer base { … }`. With Tailwind v4, start the main CSS with `@layer theme, base, ui, components, utilities;` (details in `theme.md`).
- The ESLint plugin depends only on ESLint and works with TypeScript 7. Templates that ship oxlint instead need `eslint` and an `eslint.config.js`, as above.
- pnpm may refuse a version published less than a day ago: `pnpm add @seanyeh77/ui@<version> --config.minimum-release-age=0`.

## Pages without a build step

`bundle.js` brings React 19, ReactDOM and every component (`window.React`, `window.ReactDOM`, `window.UI`):

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/0.47.2/fonts.css">
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/0.47.2/tokens.css">
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/0.47.2/styles.css">
<div id="root"></div>
<script src="https://seanyeh77.github.io/ui-design-system/dist/0.47.2/bundle.js"></script>
<script>
  const h = React.createElement;
  UI.initTheme();
  ReactDOM.createRoot(document.getElementById('root')).render(h(UI.Button, { variant: 'primary' }, '儲存'));
</script>
```

Pin a version as above: `/dist/<version>/` never changes; `/dist/` always serves the latest release. jsDelivr has the same files (`https://cdn.jsdelivr.net/npm/@seanyeh77/ui@0.47.2/dist/bundle.js`, `…/dist/styles.css`; the fonts at `https://cdn.jsdelivr.net/npm/@seanyeh77/tokens@0.47.2/fonts.css`). Without a bundler, `@seanyeh77/ui/dist/fonts.css` cannot resolve its import: load the tokens package's `fonts.css` or the pinned site URL.

Scope: web UI, and the tokens of SeanYeh's Slidev decks (`initTheme({ preset: 'teaching' })`, see `theme.md`). Slide layout, Notion documents and teaching diagrams follow the separate `teaching-materials-style` skill.
