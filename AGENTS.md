# AGENTS.md

Instructions for AI agents (Claude, Codex, Cursor and others) that build UI with this design system or change it.

## What this is

SeanYeh's design system: typed React 19 components, design tokens, page templates and written rules. Warm-gray neutrals, one blue accent (`#2457d6`, user-adjustable), Inter + Noto Sans TC, Geist Mono for numbers, light and dark themes, compact density, Phosphor icons. Overlays (Dialog, Menu, Popover, Select…) run on Base UI, so focus, keyboard and positioning are handled for you.

- Docs site (Storybook: every component, live examples, props tables): https://seanyeh77.github.io/ui-design-system/
- Index of every published file: https://seanyeh77.github.io/ui-design-system/llms.txt

| Package | What it is |
| --- | --- |
| `@seanyeh77/ui` | The components (ES module with types), `styles.css`, `bundle.js` for pages without a build step, and every README under `docs/` |
| `@seanyeh77/tokens` | `tokens.css`, a Tailwind v4 theme (`tailwind.css`), typed token names with `cssVar()`, the fonts |
| `@seanyeh77/eslint-plugin-ui` | Lint rules: token colors only, no native controls, no card in a card, danger actions confirmed, one primary button, verb labels |
| `@seanyeh77/ui-cli` | `ui check <page>` (the automatic checks below), `ui docs <Name>`, `ui list` |
| Registry `…/r/<name>.json` | Page templates to copy into a project: `dashboard`, `list-detail`, `settings`, `login` |

## Building UI with it

Use it for any web page, dashboard, frontend or tool UI unless the user asks for a different look. Your job is to pick the right template or component and connect data and events. Do not write your own styles for something a component covers.

1. Start from a page template when one fits: `npx shadcn@latest add https://seanyeh77.github.io/ui-design-system/r/dashboard.json` (also `list-detail`, `settings`, `login`). It copies an editable page into the project. Agents with the shadcn MCP server can search and add them by name once the registry is in `components.json`:

   ```json
   { "registries": { "@seanyeh77": "https://seanyeh77.github.io/ui-design-system/r/{name}.json" } }
   ```

2. Otherwise build the page from components. Frame a dashboard with `AppShell` (sidebar, top bar, phone tabs), lay out content with `Page` and `Grid`, put each block in one `Card`. Before using a component, read its README: `npx ui docs DataTable`, `node_modules/@seanyeh77/ui/docs/DataTable.md`, or the docs site.
3. Read the rules once: `docs/guidelines.md` (all confirmed choices), `docs/layout.md`, `docs/motion.md`.
4. Your own CSS uses tokens only: `var(--surface)`, `var(--space-4)`, `var(--radius-md)` in CSS; `cssVar('ink-muted')` from `@seanyeh77/tokens` in style props (only token names compile); `bg-surface text-ink-muted` with the Tailwind theme. Never hard-code a color, size or radius that has a token.
5. TypeScript enforces most rules: icon names are checked, a danger `Button` or menu item does not compile without `confirm`, `DataTable` column keys must exist on the rows. Fix type errors instead of casting them away. In development the components also warn in the console with the cause and the fix.
6. Items marked 看情況 ("situational") in the docs are not fixed rules: choose per context and say which way you chose.

### Projects with a build step (Vite, Next.js and similar)

```bash
npm i react react-dom @seanyeh77/ui @seanyeh77/tokens
npm i -D @seanyeh77/eslint-plugin-ui @seanyeh77/ui-cli
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

- React 19 is required. The module starts with `'use client'`, so it works in Next.js server components pages as client components.
- Components need a browser: run component tests in a browser (Vitest browser mode) or jsdom.

### Pages without a build step

One script brings React 19, ReactDOM and every component (`window.React`, `window.ReactDOM`, `window.UI`):

```html
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/fonts.css">
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/tokens.css">
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/styles.css">
<script src="https://seanyeh77.github.io/ui-design-system/dist/bundle.js"></script>
<script>
  const h = React.createElement;
  UI.initTheme();
  ReactDOM.createRoot(document.getElementById('root')).render(h(UI.Button, { variant: 'primary' }, '儲存'));
</script>
```

For a single-file page that must work offline or in a sandbox that blocks this host, inline the same files. `bundle.js` keeps the development warnings on.

### Rules that are easy to miss

No native `<select>`, `<table>` or checkbox (use Select, DataTable, Checkbox); one primary button per section; button labels are verbs (儲存, 刪除, never 確定); danger actions confirm in a Dialog; dates `2026/11/04（三）` with relative time inside a week; amounts `NT$ 1,280`; numbers right-aligned with tabular figures; error messages give the cause and the fix; status uses `Badge`, never color alone.

### Before you finish

Run `npx ui check <file or URL>`. It opens the page at 390 px and 1280 px, light and dark, and fails on console errors, horizontal overflow at 390 px, touch targets under 48 px, a card inside a card, raw Markdown, native controls the system replaces, and wrapped buttons, tabs, headers or headings. Add `--shots shots/` and look at the screenshots for the rest of this list:

- Components: wherever `@seanyeh77/ui` has a component for the job, it is used and its README was read. Nothing is hand-built that a component covers.
- Fonts: Geist Mono only on numbers, code, file paths and IDs, never on a Chinese sentence or a whole meta line.
- Sizes: body text is one size; secondary text is one step smaller. No ad-hoc sizes for a single row.
- Text: only the point, in formal written Chinese. Explanations are at most 2 short sentences; nothing the screen already shows is said again; no question-style titles or links. See 文字語氣 in `docs/guidelines.md`.
- Cards: one shadow per block. TreeList, KpiCard, Alert and SettingsSection are already cards and lose their shadow inside `Card`.
- Titles: the page title appears once, in the top bar or as the page heading, not both.
- Links: file paths, line references, IDs and anything else that points somewhere are links.
- Long lists of results: items that need attention (errors, to confirm) come first or can be filtered from the summary.
- Phones: long text is left-aligned.

Scope: this system covers web UI and the tokens of SeanYeh's Slidev decks. Slidev decks use the `teaching` preset (`data-theme="teaching"` in `tokens.css`, defined under `presets` in `packages/tokens/tokens.json`): warm-gray neutrals and Inter / Geist Mono from this system, plus teal `#0f766e`, 0 px radius, no shadows and 1.5 px borders, light only. Deck CSS reads token names only. Slide layout and rules, Notion documents and teaching diagrams follow SeanYeh's separate `teaching-materials-style` skill.

## Changing the design system

A pnpm workspace. `pnpm install`, then `pnpm check` builds, type-checks, lints and tests everything; CI runs the same plus `ui check` on every preview.

| Path | Contents |
| --- | --- |
| `packages/tokens/tokens.json` | Every token, light and dark, and the presets. `pnpm --filter @seanyeh77/tokens build` writes the CSS, the Tailwind theme and the types. |
| `packages/ui/src/components/<Name>/` | `<Name>.tsx`, `README.md`, `<Name>.stories.tsx` (Storybook, module example) and `preview.html` (plain-HTML example; the card of the Design System artifact) |
| `packages/ui/src/styles.css` | Component styles, token variables only |
| `packages/blocks/src/` | Page templates; `registry.json` at the root lists them |
| `packages/eslint-plugin-ui`, `packages/cli` | The lint rules and `ui check` |
| `apps/docs` | Storybook; `pnpm site` builds the whole docs site into `site/` |
| `docs/` | `guidelines.md`, `layout.md`, `motion.md`, `decisions.md` |

- Components: TypeScript strict, React 19 (`ref` is a prop), Base UI for anything that floats or traps focus. Props get a JSDoc line each: it becomes the props table and what an agent reads in its editor. Prefer types that make a wrong use fail to compile over a sentence in the README; add a `devWarn` with the cause and the fix for what types cannot catch. Export new components and their types from `src/index.ts`.
- A new component needs `README.md`, a story and `preview.html` whose first line is `<!-- @dsCard group="Data" height=400 -->`, plus a test when it has behavior (`src/**/*.test.tsx`, Vitest in a real Chromium).
- Names and default texts are generic: no project's terms (no 「函式」 or 「編譯器」 as built-in words). A project passes its own words through props.
- Releases: `pnpm changeset` for every change to a published package. Merging the "Version packages" pull request publishes to npm (needs the `NPM_TOKEN` secret). Pushing to `main` rebuilds the docs site.
- Docs are written in Traditional Chinese with technical terms in English; every number carries its unit.
- Rules: confirmed choices go in `docs/guidelines.md`; the original wording of each lab decision goes in `docs/decisions.md`. Only record what the user confirmed.
- New design decisions are SeanYeh's: he picks them from option labs with a live demo for every choice. Propose options; do not change tokens, rules or component behavior on your own. Any default you pick must be flagged as yours.
- Commits never carry Claude co-author or Claude-Session trailers.
