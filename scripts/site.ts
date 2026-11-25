// Builds the docs site into site/: Storybook at the root, plus the files agents and plain pages load.
//   /dist/*            bundle.js (window.UI, React included), styles, tokens, fonts, the ES module and its types (latest)
//   /dist/<version>/   bundle.js, styles.css, tokens.css and fonts.css of one release, for pages that pin a version.
//                      With SITE_PAST_VERSIONS=1 (the Pages workflow) earlier releases are taken from their npm packages.
//   /preview/<Name>    each component's plain-HTML preview (the cards of the Design System artifact)
//   /md/<Name>.md      READMEs (用法 block first) and the guides (docs/*.md) as Markdown
//   /r/<name>.json     the shadcn registry of page templates
//   /llms.txt          an index of all of the above
// Run after `pnpm build`: node scripts/site.ts
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GROUPS, GUIDES as guides, groupOf, summary } from '../packages/cli/src/usage.ts';

const root = new URL('../', import.meta.url);
const site = new URL('site/', root);
const at = (p: string) => new URL(p, root);
const BASE = 'https://seanyeh77.github.io/ui-design-system';

execFileSync('pnpm', ['--filter', '@seanyeh77/docs', 'build'], { stdio: 'inherit', cwd: root });
cpSync(at('packages/ui/dist'), new URL('dist/', site), { recursive: true });
// The npm package's fonts.css imports @seanyeh77/tokens for a bundler to resolve; a browser loads files, so the site
// serves the tokens package's file and the fonts next to it.
cpSync(at('packages/tokens/fonts.css'), new URL('dist/fonts.css', site));
cpSync(at('packages/tokens/fonts'), new URL('dist/fonts/', site), { recursive: true });

// /dist/<version>/: the files a page without a build step loads, for one release. The fonts do not change between
// releases: every version's fonts.css points at the shared /dist/fonts/.
const NO_BUILD_FILES = ['bundle.js', 'styles.css', 'tokens.css'];
const versionedFonts = readFileSync(at('packages/tokens/fonts.css'), 'utf8').replaceAll('url(./fonts/', 'url(../fonts/');
function writeVersion(version: string, from: string) {
  const dir = new URL(`dist/${version}/`, site);
  mkdirSync(dir, { recursive: true });
  for (const f of NO_BUILD_FILES) cpSync(join(from, f), new URL(f, dir));
  writeFileSync(new URL('fonts.css', dir), versionedFonts);
}
const uiVersion = (JSON.parse(readFileSync(at('packages/ui/package.json'), 'utf8')) as { version: string }).version;
writeVersion(uiVersion, at('packages/ui/dist').pathname);
// Earlier releases from npm, from the first release that the docs tell to pin. A version that cannot be fetched is
// left out with a warning; the site still builds.
const FIRST_PINNED = [0, 45, 0];
const newer = (v: string) => {
  const n = v.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (n[i] !== FIRST_PINNED[i]) return n[i] > FIRST_PINNED[i];
  return true;
};
if (process.env.SITE_PAST_VERSIONS === '1') {
  let versions: string[] = [];
  try {
    versions = JSON.parse(execFileSync('npm', ['view', '@seanyeh77/ui', 'versions', '--json'], { encoding: 'utf8' })) as string[];
  } catch (e) {
    console.warn(`site: could not list the versions of @seanyeh77/ui on npm: ${(e as Error).message}`);
  }
  for (const v of versions.filter((v) => /^\d+\.\d+\.\d+$/.test(v) && newer(v) && v !== uiVersion)) {
    const tmp = mkdtempSync(join(tmpdir(), 'ui-site-'));
    try {
      const tgz = execFileSync('npm', ['pack', `@seanyeh77/ui@${v}`, '--silent', '--pack-destination', tmp], { encoding: 'utf8' })
        .trim()
        .split('\n')
        .pop();
      execFileSync('tar', ['-xzf', join(tmp, tgz ?? ''), '-C', tmp, ...NO_BUILD_FILES.map((f) => `package/dist/${f}`)]);
      writeVersion(v, join(tmp, 'package/dist'));
    } catch (e) {
      console.warn(`site: left out /dist/${v}/: ${(e as Error).message}`);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
}
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
    group = groupOf(src);
    // <body> may carry attributes (<body style="padding: 0">): they are kept, on the site's own <body>.
    const open = /<body[^>]*>/.exec(src);
    const body = src.slice(open ? open.index + open[0].length : 0, src.indexOf('</body>'));
    // The preview's own <head> is replaced by the site's (self-hosted fonts, tokens, bundle.js), but its <style>
    // elements are the page's layout (Cover): they move into the body, after the site's styles. A <script> in the head
    // would be lost: it belongs in the body.
    const ownHead = open ? src.slice(0, open.index) : '';
    if (/<script\b/i.test(ownHead)) throw new Error(`${name}/preview.html: move the <script> in <head> into <body>; the site keeps only <style> from the head`);
    const styles = (ownHead.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) ?? []).join('\n');
    const page = head(name).replace(/<body>\n$/, `${open?.[0] ?? '<body>'}\n`) + (styles ? styles + '\n' : '') + body;
    writeFileSync(new URL(`preview/${name}.html`, site), page + '</body>\n</html>\n');
  } else if (existsSync(readme)) group = groupOf(readFileSync(readme, 'utf8'));
  if (existsSync(readme)) {
    const md = readFileSync(readme, 'utf8');
    cpSync(readme, new URL(`md/${name}.md`, site));
    components.push({ name, group, summary: summary(md) });
  }
}
for (const f of readdirSync(at('docs/'))) if (f.endsWith('.md')) cpSync(at(`docs/${f}`), new URL(`md/${f}`, site));
cpSync(at('packages/tokens/tokens.json'), new URL('tokens/tokens.json', site));
cpSync(at('AGENTS.md'), new URL('AGENTS.md', site));
writeFileSync(new URL('.nojekyll', site), '');
execFileSync('pnpm', ['exec', 'shadcn', 'build', 'registry.json', '--output', 'site/r'], { stdio: 'inherit', cwd: root });
const blocks = (JSON.parse(readFileSync(at('registry.json'), 'utf8')) as { items: { name: string; description: string }[] }).items;

cpSync(at('packages/ui/docs/icons.md'), new URL('md/icons.md', site));
const guideFiles = readdirSync(at('docs/')).filter((f) => f.endsWith('.md') && f !== 'decisions.md' && f !== 'maintaining.md');
for (const f of guideFiles) if (!guides.some(([g]) => `${g}.md` === f)) throw new Error(`docs/${f}: add it to GUIDES in packages/cli/src/usage.ts`);
const lines = [
  '# ui-design-system',
  '',
  "> SeanYeh's design system: typed React 19 components (npm @seanyeh77/ui, or window.UI from one script), design tokens, page templates and written rules. " +
    'Warm-gray neutrals, accent #2457d6, Inter + Noto Sans TC, Geist Mono for numbers, light and dark themes. Read AGENTS.md first, then the core rules (guidelines) and the 用法 block of each component you use.',
  '',
  '## Start here',
  '',
  `- [AGENTS.md](${BASE}/AGENTS.md): how to build pages with the system, what to read, the checks to run (also in the package as docs/agents.md)`,
  ...guides.map(([f, t]) => `- [${f}](${BASE}/md/${f}.md): ${t}`),
  `- [icons](${BASE}/md/icons.md): every built-in icon name, on one line (ui docs icons)`,
  `- [maintaining](${BASE}/md/maintaining.md): how to change the design system itself (not needed to build a page)`,
  `- [decisions](${BASE}/md/decisions.md): history: the original wording of each design decision (not needed to build a page)`,
  `- [Storybook](${BASE}/): every component with live examples and its props table`,
  '',
  '## Files to load',
  '',
  `- [bundle.js](${BASE}/dist/bundle.js): every component on window.UI, React 19 included (sets window.React and window.ReactDOM too)`,
  `- [styles.css](${BASE}/dist/styles.css): component styles`,
  `- [tokens.css](${BASE}/dist/tokens.css): CSS variables for every token, light, dark and the teaching preset`,
  `- [fonts.css](${BASE}/dist/fonts.css): self-hosted Inter, Geist Mono and Noto Sans TC, weights 400 to 700`,
  `- ${BASE}/dist/<version>/ (bundle.js, styles.css, tokens.css, fonts.css): the same files of one release, from ${FIRST_PINNED.join('.')} on; pin a version in pages that must not change`,
  `- [index.d.ts](${BASE}/dist/index.d.ts): props and API types`,
  `- [tokens.json](${BASE}/tokens/tokens.json): token values with their intended use`,
  '',
  '## Page templates (shadcn registry)',
  '',
  ...blocks.map((b) => `- [${b.name}](${BASE}/r/${b.name}.json): ${b.description}`),
  '',
  '## Components',
  '',
  'Each README starts with a 用法 block (what it is, a minimal example, the rules most often gotten wrong); read that, the details only when needed.',
  '',
  ...components.map(
    (c) => `- [${c.name}](${BASE}/md/${c.name}.md) (${GROUPS[c.group] ?? c.group}): ${c.summary} Plain-HTML preview: ${BASE}/preview/${c.name}.html`,
  ),
  '',
];
writeFileSync(new URL('llms.txt', site), lines.join('\n'));
console.log(`site/: Storybook, ${components.length} components, ${blocks.length} page templates`);
