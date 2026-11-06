// Builds the docs site into site/: Storybook at the root, plus the files agents and plain pages load.
//   /dist/*            bundle.js (window.UI, React included), styles, tokens, fonts, the ES module and its types
//   /preview/<Name>    each component's plain-HTML preview (the cards of the Design System artifact)
//   /md/<Name>.md      READMEs and guides as Markdown
//   /r/<name>.json     the shadcn registry of page templates
//   /llms.txt          an index of all of the above
// Run after `pnpm build`: node scripts/site.ts
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const site = new URL('site/', root);
const at = (p: string) => new URL(p, root);
const BASE = 'https://seanyeh77.github.io/ui-design-system';
const GROUPS: Record<string, string> = {
  Foundations: '基礎',
  Layout: '版面',
  Actions: '按鈕',
  Forms: '表單',
  Data: '數據呈現',
  Status: '狀態',
  Feedback: '回饋',
  Overlays: '浮層',
  Navigation: '導覽',
  Appearance: '外觀',
  Pages: '頁面範本',
};

execFileSync('pnpm', ['--filter', '@seanyeh77/docs', 'build'], { stdio: 'inherit', cwd: root });
cpSync(at('packages/ui/dist'), new URL('dist/', site), { recursive: true });
mkdirSync(new URL('preview/', site), { recursive: true });
mkdirSync(new URL('md/', site), { recursive: true });
mkdirSync(new URL('tokens/', site), { recursive: true });

const head = (name: string) => `<!doctype html>
<html lang="zh-Hant">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${name}</title>
<link rel="stylesheet" href="../dist/fonts.css"><link rel="stylesheet" href="../dist/tokens.css"><link rel="stylesheet" href="../dist/styles.css">
<style>body{margin:0;padding:24px;font-family:var(--font-sans);color:var(--ink);background:var(--bg)}</style>
<script>try{var t=new URLSearchParams(location.search).get('theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}</script>
<script src="../dist/bundle.js"></script>
</head>
<body>
`;

const components: { name: string; group: string; summary: string }[] = [];
const compDir = at('packages/ui/src/components/');
for (const name of readdirSync(compDir).sort()) {
  const dir = new URL(`${name}/`, compDir);
  const preview = new URL('preview.html', dir);
  const readme = new URL('README.md', dir);
  let group = 'Other';
  if (existsSync(preview)) {
    const src = readFileSync(preview, 'utf8');
    group = /group="([^"]+)"/.exec(src)?.[1] ?? 'Other';
    const body = src.slice(src.indexOf('<body>') + 6, src.indexOf('</body>'));
    writeFileSync(new URL(`preview/${name}.html`, site), head(name) + body + '</body>\n</html>\n');
  }
  if (existsSync(readme)) {
    const md = readFileSync(readme, 'utf8');
    cpSync(readme, new URL(`md/${name}.md`, site));
    const summary =
      md
        .split('\n')
        .find((l) => l.trim() && !l.startsWith('#'))
        ?.trim() ?? '';
    components.push({ name, group, summary });
  }
}
for (const f of readdirSync(at('docs/'))) if (f.endsWith('.md')) cpSync(at(`docs/${f}`), new URL(`md/${f}`, site));
cpSync(at('packages/tokens/tokens.json'), new URL('tokens/tokens.json', site));
cpSync(at('AGENTS.md'), new URL('AGENTS.md', site));
writeFileSync(new URL('.nojekyll', site), '');
execFileSync('pnpm', ['exec', 'shadcn', 'build', 'registry.json', '--output', 'site/r'], { stdio: 'inherit', cwd: root });
const blocks = (JSON.parse(readFileSync(at('registry.json'), 'utf8')) as { items: { name: string; description: string }[] }).items;

const guides: [string, string][] = [
  ['guidelines', 'All confirmed design rules'],
  ['layout', 'Page structure and breakpoints'],
  ['motion', 'Animation durations and effects'],
  ['decisions', 'Original wording of each lab decision'],
];
const lines = [
  '# ui-design-system',
  '',
  "> SeanYeh's design system: typed React 19 components (npm @seanyeh77/ui, or window.UI from one script), design tokens, page templates and written rules. " +
    'Warm-gray neutrals, accent #2457d6, Inter + Noto Sans TC, Geist Mono for numbers, light and dark themes. Read AGENTS.md first.',
  '',
  '## Start here',
  '',
  `- [AGENTS.md](${BASE}/AGENTS.md): how to build with the system, the checks to run, and how to change it`,
  ...guides.map(([f, t]) => `- [${f}](${BASE}/md/${f}.md): ${t}`),
  `- [Storybook](${BASE}/): every component with live examples and its props table`,
  '',
  '## Files to load',
  '',
  `- [bundle.js](${BASE}/dist/bundle.js): every component on window.UI, React 19 included (sets window.React and window.ReactDOM too)`,
  `- [styles.css](${BASE}/dist/styles.css): component styles`,
  `- [tokens.css](${BASE}/dist/tokens.css): CSS variables for every token, light, dark and the teaching preset`,
  `- [fonts.css](${BASE}/dist/fonts.css): self-hosted Inter, Geist Mono and Noto Sans TC, weights 400 to 700`,
  `- [index.d.ts](${BASE}/dist/index.d.ts): props and API types`,
  `- [tokens.json](${BASE}/tokens/tokens.json): token values with their intended use`,
  '',
  '## Page templates (shadcn registry)',
  '',
  ...blocks.map((b) => `- [${b.name}](${BASE}/r/${b.name}.json): ${b.description}`),
  '',
  '## Components',
  '',
  ...components.map(
    (c) => `- [${c.name}](${BASE}/md/${c.name}.md) (${GROUPS[c.group] ?? c.group}): ${c.summary} Plain-HTML preview: ${BASE}/preview/${c.name}.html`,
  ),
  '',
];
writeFileSync(new URL('llms.txt', site), lines.join('\n'));
console.log(`site/: Storybook, ${components.length} components, ${blocks.length} page templates`);
