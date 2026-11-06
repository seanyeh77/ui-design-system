# AGENTS.md

Instructions for AI agents (Claude, Codex, Cursor and others) that build UI with this design system or change it.

## What this is

SeanYeh's design system: React components (React 18 or 19) on `window.UI` and in the npm package `@seanyeh77/ui`, design tokens, and written rules. Warm-gray neutrals, one blue accent (`#2457d6`, user-adjustable), Inter + Noto Sans TC, Geist Mono for numbers and labels, light and dark themes, compact density, Phosphor icons.

- Docs site (live previews of every component): https://seanyeh77.github.io/ui-design-system/
- Machine-readable index of every file below: https://seanyeh77.github.io/ui-design-system/llms.txt

## Building UI with it

Use it for any web page, dashboard, frontend or tool UI unless the user asks for a different look.

1. Read the rules first: `docs/guidelines.md` (all confirmed choices), `docs/layout.md` (page structure, breakpoints), `docs/motion.md` (durations, animations). Before using a component, read its `components/<Name>/README.md`.
2. Load the published files instead of copying values:

```html
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/fonts.css">
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/tokens.css">
<link rel="stylesheet" href="https://seanyeh77.github.io/ui-design-system/dist/bundle.css">
<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://seanyeh77.github.io/ui-design-system/dist/bundle.js"></script>
```

   For a single-file page that must work offline or in a sandbox that blocks these hosts, inline the contents of the same files instead.
3. Use components from `window.UI` (types in `dist/index.d.ts`) rather than hand-building equivalents. Call `UI.initTheme()` once; theme via `UI.setTheme('light' | 'dark' | 'auto')`, accent via `UI.setAccent(hex)`.
4. When you must write your own CSS, use the CSS variables from `tokens.css` (`var(--bg)`, `var(--surface)`, `var(--ink)`, `var(--accent)`, `var(--space-4)`, `var(--radius-md)` and so on). Never hard-code a color, size or radius that has a token. Token names and their intended use are in `tokens/tokens.json`.
5. Rules that are easy to miss: no native `<select>`; one primary button per section; button labels are verbs only; dates `2026/11/04（三）` with relative time inside a week; amounts `NT$ 1,280`; numbers right-aligned with tabular figures; danger actions confirm in a Dialog; error messages give the cause and the fix.
6. Items marked 看情況 ("situational") in the docs are not fixed rules: choose per context and say which way you chose.

### Projects with a build step (Vite and similar)

Install the package `@seanyeh77/ui`: an ES module with the same components, React and React DOM as peer dependencies (18 or 19), plus the CSS and font files.

```bash
npm i react react-dom github:seanyeh77/ui-design-system#<commit or tag>   # until it is on npm; pins that version
```

```ts
import '@seanyeh77/ui/fonts.css';   // self-hosted Inter, Geist Mono, Noto Sans TC: works offline
import '@seanyeh77/ui/tokens.css';
import '@seanyeh77/ui/bundle.css';
import { Button, DataTable, initTheme } from '@seanyeh77/ui';   // or: import UI from '@seanyeh77/ui'
```

- Types come with the package. Tested with React 19.3.1, Vite 8 and TypeScript strict.
- Components need a browser: in server rendering or Vitest without a DOM the exports are undefined. Run component tests with `environment: 'jsdom'`.
- The UMD file is still there as `@seanyeh77/ui/umd` (or `dist/bundle.js`) for pages without a build step.

### Before you finish

Check the page against this list, at 390 px and 1280 px wide, in light and dark. Take a screenshot if you can.

`python3 scripts/check_page.py <file or URL> --shots shots/` does the automatic part (console errors, overflow at 390 px, touch targets under 48 px) and exits with 1 when something fails; the rest of the list needs a look at the screenshots.

- Components: wherever `window.UI` has a component for the job, it is used and its README was read. Nothing is hand-built that a component already covers.
- Fonts: Geist Mono only on numbers, code, file paths and IDs, never on a Chinese sentence or a whole meta line.
- Sizes: body text is one size; secondary text is one step smaller. No ad-hoc sizes for a single row.
- Wrapping: no label, heading, table header, tab or button text wraps. Widen it, shorten it, or truncate with an ellipsis and a tooltip.
- Markdown: rendered, never shown raw. No visible backticks, asterisks or `#`; code inside a sentence uses the inline code style.
- Text: only the point, in formal written Chinese. Explanations are at most 2 short sentences; nothing the screen already shows is said again; no question-style titles or links. See 文字語氣 in `docs/guidelines.md`.
- Titles: the page title appears once, in the top bar or as the page heading, not both.
- Links: file paths, line references, IDs and anything else that points somewhere are links.
- Status: shown with `UI.Badge` or the component's own status style, never by color alone.
- Long lists of results: items that need attention (errors, to confirm) come first or can be filtered from the summary.
- Phones: nothing overflows the screen; long text is left-aligned; touch targets are at least 48 px (components get this automatically on touch screens; text links inside a sentence are exempt).

Scope: this system covers web UI and the tokens of SeanYeh's Slidev decks. Slidev decks use the `teaching` preset (`data-theme="teaching"` in `tokens.css`, defined under `presets` in `tokens/tokens.json`): warm-gray neutrals and Inter / Geist Mono from this system, plus teal `#0f766e`, 0 px radius, no shadows and 1.5 px borders, light only. Deck CSS reads token names only. Slide layout and rules, Notion documents and teaching diagrams follow SeanYeh's separate `teaching-materials-style` skill.

## Changing the design system

- Tokens: edit `tokens/tokens.json` (theme presets live under `presets`; each lists only values that differ from light), then run `python3 scripts/build_tokens.py` to regenerate `dist/tokens.css`. Do not edit `dist/tokens.css` by hand.
- Components: edit `dist/bundle.js` and `dist/bundle.css`, update `components/<Name>/README.md` and `dist/index.d.ts` (declare the new export, then `python3 scripts/ui_keys.py --write` updates `Window.UI`), and run `python3 scripts/build_esm.py` to regenerate `dist/index.js`. CI fails when any of them is out of date.
- Releases: bump `version` in `package.json`, push a tag `v<version>`; the publish workflow puts it on npm (needs the `NPM_TOKEN` secret). A new component also needs `components/<Name>/preview.html` whose first line is `<!-- @dsCard group="Data" height=400 -->`.
- Rules: confirmed choices go in `docs/guidelines.md`; the original wording of each lab decision goes in `docs/decisions.md`. Only record what the user confirmed.
- Preview locally: `python3 scripts/build_tokens.py && python3 scripts/build_site.py`, then serve `site/`.
- Pushing to `main` rebuilds and publishes the docs site through GitHub Actions.
- Docs are written in Traditional Chinese with technical terms in English; every number carries its unit.
- New design decisions are SeanYeh's: he picks them from option labs with a live demo for every choice. Propose options; do not change tokens, rules or component behavior on your own. Any default you pick must be flagged as yours.
- Commits never carry Claude co-author or Claude-Session trailers.
