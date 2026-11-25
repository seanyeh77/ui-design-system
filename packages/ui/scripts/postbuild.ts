// Joins the style files into dist/styles.css and the per-component files in dist/css/, copies tokens.css and points
// fonts.css at @seanyeh77/tokens in dist/, and the component READMEs and the guides into docs/ so an agent can read them
// from node_modules/@seanyeh77/ui/docs.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { componentDependencies, componentSource, styleFiles, LAYER_ORDER, LAYER } from './styles.ts';

const root = new URL('../', import.meta.url);
const tokens = new URL('../tokens/', root);
const dist = new URL('dist/', root);
const src = new URL('src/', root);
const read = (path: string) => readFileSync(new URL(path, src), 'utf8');
const wrap = (body: string) => `@layer ${LAYER} {\n${body}}\n`;

// dist/styles.css: every file in the order of src/styles.css, in one layer block.
const files = styleFiles();
writeFileSync(new URL('styles.css', dist), `/* @seanyeh77/ui */\n${LAYER_ORDER}\n${wrap(files.map((f) => read(f.path)).join(''))}`);

// dist/css/: base.css (shared, first), <Name>.css per component, end.css (shared, last). styles.css is exactly
// base.css, then every component file in order, then end.css. A component file imports the files of the components it
// needs (those it renders or whose classes it uses), which come before it in src/styles.css, so on its own it brings
// everything it needs, in the order of styles.css. The build stops when a needed file comes later.
const css = new URL('css/', dist);
rmSync(css, { recursive: true, force: true });
mkdirSync(css);
const parts = files.map((f) => f.part).join(' ');
if (!/^(base )*(component )*(end ?)*$/.test(parts + ' '))
  throw new Error(
    'src/styles.css: list the shared files of base.css first and those of end.css last, so styles.css equals base.css + the components + end.css',
  );
const shared = (part: 'base' | 'end') => files.filter((f) => f.part === part);
for (const part of ['base', 'end'] as const)
  writeFileSync(
    new URL(`${part}.css`, css),
    `${LAYER_ORDER}\n${wrap(
      shared(part)
        .map((f) => read(f.path))
        .join(''),
    )}`,
  );
const components = files.filter((f) => f.part === 'component');
const position = new Map(components.map((f, i) => [f.name, i]));
const at = (name: string) => position.get(name) ?? -1;
const hasCss = new Set(components.map((f) => f.name));
const componentNames = readdirSync(new URL('components/', src)).filter((n) => existsSync(new URL(`components/${n}/${n}.tsx`, src)));
const source = (name: string) => componentSource(src, name, hasCss);
const deps = componentDependencies(files, read, source);
// Components that need each other (Button opens a Dialog, a Dialog shows Buttons) form a group: the group's first file
// in src/styles.css carries the rules of every member, and the other members' files import it.
const reach = (from: string) => {
  const seen = new Set<string>();
  const walk = (n: string) => {
    for (const d of deps.get(n) ?? [])
      if (!seen.has(d.name)) {
        seen.add(d.name);
        walk(d.name);
      }
  };
  walk(from);
  return seen;
};
const reachable = new Map(components.map((f) => [f.name, reach(f.name)]));
const groupOf = (name: string) => components.map((f) => f.name).filter((n) => n === name || (reachable.get(name)?.has(n) && reachable.get(n)?.has(name)));
const problems: string[] = [];
for (const f of components) {
  const group = groupOf(f.name);
  const span = group.map(at);
  if (Math.max(...span) - Math.min(...span) !== group.length - 1)
    problems.push(`${group.join(', ')} need each other: list them next to each other in src/styles.css`);
  for (const d of deps.get(f.name) ?? [])
    if (!group.includes(d.name) && at(d.name) > at(f.name))
      problems.push(`${f.name} ${d.why}: move ${d.name}'s file before ${f.name}'s in src/styles.css (or move the shared class to a shared file)`);
}
if (problems.length) throw new Error(`postbuild: per-component CSS would miss rules:\n  ${[...new Set(problems)].join('\n  ')}`);
for (const f of components) {
  const group = groupOf(f.name);
  const carrier = group[0];
  let body: string;
  if (carrier !== f.name) body = `@import './${carrier}.css';\n`;
  else {
    const need = new Set(group.flatMap((g) => (deps.get(g) ?? []).map((d) => d.name)).filter((n) => !group.includes(n)));
    const imports = [...need]
      .sort((a, b) => at(a) - at(b))
      .map((d) => `@import './${d}.css';\n`)
      .join('');
    const own = group.map((g) => read(components[at(g)].path)).join('');
    body = imports + wrap(own);
  }
  writeFileSync(new URL(`${f.name}.css`, css), `${LAYER_ORDER}\n${body}`);
}
// Components without a CSS file of their own (LineChart, TextField…) get one that imports what they render, so a page
// imports the file of every component it uses.
const without = componentNames.filter((n) => !hasCss.has(n));
for (const [name, need] of componentDependencies(files, read, source, without)) {
  const imports = need
    .map((d) => d.name)
    .sort((a, b) => at(a) - at(b))
    .map((d) => `@import './${d}.css';\n`)
    .join('');
  writeFileSync(new URL(`${name}.css`, css), `${LAYER_ORDER}\n${imports}`);
}
// The check above in reverse: every file a component's code needs is among the files its CSS imports, directly or
// through another file.
const imported = (name: string, seen = new Set<string>()): Set<string> => {
  for (const m of readFileSync(new URL(`${name}.css`, css), 'utf8').matchAll(/@import '\.\/(\w+)\.css'/g))
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      imported(m[1], seen);
    }
  return seen;
};
for (const f of components) {
  const has = imported(f.name);
  for (const g of groupOf(f.name)) has.add(g);
  for (const d of deps.get(f.name) ?? []) if (!has.has(d.name)) problems.push(`dist/css/${f.name}.css does not bring ${d.name}'s rules (${f.name} ${d.why})`);
}
if (problems.length) throw new Error(`postbuild:\n  ${problems.join('\n  ')}`);

// tokens.css is small (about 6 KB): a copy, so @seanyeh77/ui/tokens.css works on its own, also from a CDN. The fonts
// (about 11 MB) ship only in @seanyeh77/tokens, a dependency of this package: @seanyeh77/ui/fonts.css imports that
// package's file, and the bundler resolves the import and the font URLs inside it.
cpSync(new URL('dist/tokens.css', tokens), new URL('tokens.css', dist));
rmSync(new URL('fonts', dist), { recursive: true, force: true });
writeFileSync(
  new URL('fonts.css', dist),
  "/* @seanyeh77/ui/fonts.css: the self-hosted fonts of @seanyeh77/tokens (a dependency of @seanyeh77/ui). */\n@import '@seanyeh77/tokens/fonts.css';\n",
);

const docs = new URL('docs/', root);
mkdirSync(docs, { recursive: true });
const componentDir = new URL('components/', src);
// components.json: each component's group (from the first line of its preview.html), for `ui list`.
const groups: { name: string; group: string }[] = [];
for (const name of readdirSync(componentDir).sort()) {
  const readme = new URL(`${name}/README.md`, componentDir);
  if (!existsSync(readme)) continue;
  cpSync(readme, new URL(`${name}.md`, docs));
  const preview = new URL(`${name}/preview.html`, componentDir);
  // The same rule as groupOf in packages/cli/src/usage.ts: the @dsCard line of preview.html, else of the README.
  const group = /<!-- @dsCard group="([^"]+)"/.exec(readFileSync(existsSync(preview) ? preview : readme, 'utf8'))?.[1] ?? 'Other';
  groups.push({ name, group });
}
writeFileSync(new URL('components.json', docs), JSON.stringify(groups, null, 2) + '\n');
// icons.md: every built-in icon name on one line (`ui docs icons`), read from src/icons/names.ts.
const names = read('icons/names.ts');
const block = (from: string) => names.slice(names.indexOf(from), names.indexOf('\n}', names.indexOf(from)));
const keys = (text: string) => [...text.matchAll(/^\s+'?([\w-]+)'?:/gm)].map((m) => m[1]);
const phosphor = keys(block('export const LOAD')).sort();
const lucide = keys(block('export const PH_ALIAS')).sort();
if (phosphor.length < 50) throw new Error('postbuild: could not read the icon names from src/icons/names.ts');
writeFileSync(
  new URL('icons.md', docs),
  `# 圖示名稱\n\nIcon 的 \`name\` 和元件的 \`icon\` 接受的 ${phosphor.length} 個內建 Phosphor 名稱（\`filled\` 換實心版；其他圖示傳 24 px 的 path）：\n\n${phosphor.join(' ')}\n\n也接受這 ${lucide.length} 個 Lucide 名稱（對應到上面的圖示）：\n\n${lucide.join(' ')}\n`,
);
// The guides: the core rules (guidelines.md) and the topic files. decisions.md (history) and maintaining.md (changing the
// design system) are not something to build a page from. agents.md: AGENTS.md, the reading path, for offline use.
const guides = new URL('../../docs/', root);
for (const file of readdirSync(guides))
  if (file.endsWith('.md') && file !== 'decisions.md' && file !== 'maintaining.md') cpSync(new URL(file, guides), new URL(file, docs));
cpSync(new URL('../../AGENTS.md', root), new URL('agents.md', docs));
console.log(`postbuild: styles (${files.length} files, ${components.length} per component), tokens, fonts, docs and icon names`);
