# AGENTS.md

Instructions for AI agents (Claude, Codex, Cursor and others) that build UI with this design system or change it.

## What this is

SeanYeh's design system: React 18 components on `window.UI`, design tokens, and written rules. Warm-gray neutrals, one blue accent (`#2457d6`, user-adjustable), Inter + Noto Sans TC, Geist Mono for numbers and labels, light and dark themes, compact density, Phosphor icons.

- Docs site (live previews of every component): https://seanyeh77.github.io/ui-design-system/
- Machine-readable index of every file below: https://seanyeh77.github.io/ui-design-system/llms.txt

## Building UI with it

Use it for any web page, dashboard, frontend or tool UI unless the user asks for a different look.

1. Read the rules first: `docs/guidelines.md` (all confirmed choices), `docs/layout.md` (page structure, breakpoints), `docs/motion.md` (durations, animations). Before using a component, read its `components/<Name>/README.md`.
2. Load the published files instead of copying values:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet">
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

Scope: this system covers web UI. Slidev decks, Notion documents and teaching diagrams follow SeanYeh's separate `teaching-materials-style` skill until a teaching theme preset is added here.

## Changing the design system

- Tokens: edit `tokens/tokens.json`, then run `python3 scripts/build_tokens.py` to regenerate `dist/tokens.css`. Do not edit `dist/tokens.css` by hand.
- Components: edit `dist/bundle.js` and `dist/bundle.css`, update `components/<Name>/README.md` and `dist/index.d.ts`. A new component also needs `components/<Name>/preview.html` whose first line is `<!-- @dsCard group="Data" height=400 -->`.
- Rules: confirmed choices go in `docs/guidelines.md`; the original wording of each lab decision goes in `docs/decisions.md`. Only record what the user confirmed.
- Preview locally: `python3 scripts/build_tokens.py && python3 scripts/build_site.py`, then serve `site/`.
- Pushing to `main` rebuilds and publishes the docs site through GitHub Actions.
- Docs are written in Traditional Chinese with technical terms in English; every number carries its unit.
