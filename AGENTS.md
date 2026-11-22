# AGENTS.md

Instructions for AI agents (Claude, Codex, Cursor and others) that build UI with this design system or change it.

## What this is

SeanYeh's design system: typed React 19 components, design tokens, page templates and written rules. Overlays (Dialog, Menu, Popover, Select…) run on Base UI, so focus, keyboard and positioning are handled for you.

Docs site (Storybook, live examples, props tables): https://seanyeh77.github.io/ui-design-system/ ; index of every published file: https://seanyeh77.github.io/ui-design-system/llms.txt

| Package | What it is |
| --- | --- |
| `@seanyeh77/ui` | The components (ES module with types), `styles.css`, `bundle.js` for pages without a build step, and the docs under `docs/` (each README and guide) |
| `@seanyeh77/tokens` | `tokens.css`, a Tailwind v4 theme (`tailwind.css`), typed token names with `cssVar()`, the fonts |
| `@seanyeh77/eslint-plugin-ui` | Lint rules: tokens only, no native controls, no card in a card, danger actions confirmed, one primary button, verb labels |
| `@seanyeh77/ui-cli` | `ui check <page>`, `ui docs <Name> [--full]`, `ui list`. Run it as `npx @seanyeh77/ui-cli …`: plain `npx ui` runs an unrelated npm package. |
| Registry `…/r/<name>.json` | Page templates to copy into a project: `dashboard`, `list-detail`, `settings`, `login` |

## Building UI with it

Use it for any web page, dashboard, frontend or tool UI unless the user asks for a different look. Pick the template or components, connect data and events, and spend the effort on the page's design and UX. Do not write your own styles for something a component covers.

What to read, and nothing more:

1. `docs/guidelines.md`: the core rules every page needs (about 6 KB). Read it once.
2. The 用法 block of each component you use: `npx @seanyeh77/ui-cli docs DataTable` prints what it is, a minimal example and the rules most often gotten wrong. Add `--full` only when you need a detail the block does not cover. The same files are in `node_modules/@seanyeh77/ui/docs/` and on the docs site under `/md/`.
3. A topic file only when the page has that topic: `layout` (your own frame, navigation, search, tours), `forms`, `data` (tables, lists, KPIs, charts), `monitoring`, `code` (code-reading tools), `theme` (all tokens, accent, Slidev preset), `motion`. `ui docs layout` prints one.

Then:

- Start from a page template when one fits: `npx shadcn@latest add https://seanyeh77.github.io/ui-design-system/r/dashboard.json` (also `list-detail`, `settings`, `login`). It needs a `components.json` (run `npx shadcn@latest init` first, or the command stops at a prompt) and `@seanyeh77/ui` installed. Without shadcn, read the files from the same JSON (`files[].content`) and write them yourself. With the shadcn MCP server, add `{ "registries": { "@seanyeh77": "https://seanyeh77.github.io/ui-design-system/r/{name}.json" } }` to `components.json` and add them by name.
- Otherwise frame a dashboard with `AppShell`, lay out content with `Page` and `Grid`, one `Card` per block.
- Your own CSS uses tokens only: `var(--surface)`, `var(--space-4)` in CSS; `cssVar('ink-muted')` from `@seanyeh77/tokens` in style props (only token names compile); `bg-surface text-ink-muted` with the Tailwind theme.
- TypeScript enforces most rules: icon names, `confirm` on danger buttons and menu items, `DataTable` column keys. Fix type errors instead of casting them away. In development the components warn in the console with the cause and the fix.
- Items marked 看情況 ("situational") are not fixed rules: choose per context and say which way you chose.
- Before you finish: run `npx @seanyeh77/ui-cli check <file or URL>`. It opens the page at 390 px and 1280 px, light and dark, and fails on console errors, horizontal overflow at 390 px, touch targets under 48 px, touch areas that spill past their control, a card inside a card, raw Markdown, native controls the system replaces, wrapped buttons, tabs, headers or headings, controls of different heights in one toolbar, and a status badge with a shadow in a table or card. Add `--shots shots/` and check the screenshots against the last section of `guidelines.md`.

### Rules that are easy to miss

- List page: title once (top bar); the list in one `Card`; the page's primary action (新增) in that Card's `actions`, never in the sidebar; the count comes from the DataTable toolbar, not next to the title.
- Buttons: `primary` solid, at most one per section; `secondary` outline; `quiet` for low-emphasis and toolbar actions; `danger` always confirmed.
- Status is a `Badge` (dot + text in tables and cards), never a hand-made colored chip; only states that need attention stand out.
- Numbers are numbers: `numeric` + `unit`, `format: 'duration'` or `'relative'`, never strings like 「46 分」.
- Summary tabs already give the counts: no KPI cards repeating them, and a condition in the summary is not also a filter. Table rules: `docs/data.md`.

### Projects with a build step (Vite, Next.js and similar)

```bash
npm i react react-dom @seanyeh77/ui @seanyeh77/tokens
npm i -D @seanyeh77/eslint-plugin-ui @seanyeh77/ui-cli
npx playwright install chromium   # the browser ui check uses; or set CHROMIUM_PATH
```

Until the packages are on npm, build them in a clone (`pnpm install && pnpm build`), pack them (`pnpm --filter @seanyeh77/ui pack`, same for the others) and install the `.tgz` files. `@seanyeh77/ui` carries `tokens.css` and the fonts too, so `@seanyeh77/tokens` is needed only for `cssVar()` and the Tailwind theme.

```ts
import '@seanyeh77/ui/fonts.css'; // self-hosted fonts: works offline
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

- React 19 is required. The module starts with `'use client'`, so it works in Next.js server components pages as client components. Server code that only formats dates, numbers or text imports from `@seanyeh77/ui/format` (no `'use client'`).
- The ESLint config reads `.tsx` with the typescript-eslint parser, which needs the `typescript` 5 or 6 API. With TypeScript 7 only, also install `typescript@npm:@typescript/typescript6` as a dev dependency.
- Components need a browser: run component tests in a browser (Vitest browser mode) or jsdom.

### Pages without a build step

`bundle.js` brings React 19, ReactDOM and every component (`window.React`, `window.ReactDOM`, `window.UI`); the styles are in `styles.css`:

```html
<meta charset="utf-8">
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/fonts.css">
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/tokens.css">
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/styles.css">
<div id="root"></div>
<script src="https://seanyeh77.github.io/ui-design-system/dist/bundle.js"></script>
<script>
  const h = React.createElement;
  UI.initTheme();
  ReactDOM.createRoot(document.getElementById('root')).render(h(UI.Button, { variant: 'primary' }, '儲存'));
</script>
```

For a single-file page that must work offline or in a sandbox that blocks this host, inline the same files. `bundle.js` keeps the development warnings on.

Scope: web UI and the tokens of SeanYeh's Slidev decks (the `teaching` preset, `data-theme="teaching"`: teal `#0e827d` accent, 0 px radius, no shadows, 1.5 px borders, light only; see `theme.md`). Slide layout, Notion documents and teaching diagrams follow SeanYeh's separate `teaching-materials-style` skill.

## Changing the design system

A pnpm workspace. `pnpm install`, then `pnpm check` builds, type-checks, lints and tests everything; CI runs the same plus `ui check` on every preview.

| Path | Contents |
| --- | --- |
| `packages/tokens/tokens.json` | Every token, light and dark, and the presets. `pnpm --filter @seanyeh77/tokens build` writes the CSS, the Tailwind theme and the types. |
| `packages/ui/src/components/<Name>/` | `<Name>.tsx`, `README.md`, `<Name>.stories.tsx` (Storybook, module example) and `preview.html` (plain-HTML example; the card of the Design System artifact) |
| `packages/ui/src/styles.css` | Component styles, token variables only |
| `packages/blocks/src/` | Page templates; `registry.json` at the root lists them |
| `packages/eslint-plugin-ui`, `packages/cli` | The lint rules, `ui check` and `ui docs` |
| `apps/docs` | Storybook; `pnpm site` builds the whole docs site into `site/` (with `llms.txt` and `/md/`) |
| `docs/` | `guidelines.md` (core rules), the topic files, `decisions.md` (history) |

- Components: TypeScript strict, React 19 (`ref` is a prop), Base UI for anything that floats or traps focus. One JSDoc line per prop (it becomes the props table). Prefer types that make a wrong use fail to compile over a sentence in the README; add a `devWarn` with the cause and the fix for what types cannot catch. Export new components and their types from `src/index.ts`.
- A new component needs `README.md`, a story and `preview.html` whose first line is `<!-- @dsCard group="Data" height=400 -->`, plus a test when it has behavior (`src/**/*.test.tsx`, Vitest in a real Chromium).
- A README starts with `## 用法`: one sentence (what it is, when to use it, what to use instead), a minimal example, and the 3 to 6 rules most often gotten wrong. Details follow in later `##` sections. The first sentence is the summary in `llms.txt` and `ui list`.
- Where a rule goes: one component's rule in its README; a rule every page needs in `docs/guidelines.md` (keep it about 6 KB); a rule for one kind of page in its topic file. Say each rule once. A new topic file goes in the guides lists of `scripts/site.ts` and `apps/docs/scripts/pages.ts`.
- Names and default texts are generic: no project's terms (no 「函式」 or 「編譯器」 as built-in words). A project passes its own words through props.
- Releases: `pnpm changeset` for every change to a published package. Merging the "Version packages" pull request publishes to npm through trusted publishing (each package names this repo and `publish.yml` as its Trusted Publisher on npmjs.com; no token). Pushing to `main` rebuilds the docs site.
- Docs are written in Traditional Chinese with technical terms in English; every number carries its unit.
- Only record what the user confirmed: the rule in the file above, the original wording of each lab decision in `docs/decisions.md`.
- New design decisions are SeanYeh's: he picks them from option labs with a live demo for every choice. Propose options; do not change tokens, rules or component behavior on your own. Any default you pick must be flagged as yours. In `docs/decisions.md` they go under 「AI 定的細節（待確認）」, whichever agent (Claude, Codex, Cursor or another) picked them; when SeanYeh leaves the details to the agent, write that down with his words.
- Commits never carry Claude co-author or Claude-Session trailers.
