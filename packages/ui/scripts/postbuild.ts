// Joins the style files into dist/styles.css and the per-component files in dist/css/, copies the token files and the
// fonts next to the JavaScript in dist/, and the component READMEs and the guides into docs/ so an agent can read them
// from node_modules/@seanyeh77/ui/docs.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { styleFiles, LAYER_ORDER, LAYER } from './styles.ts';

const root = new URL('../', import.meta.url);
const tokens = new URL('../tokens/', root);
const dist = new URL('dist/', root);
const src = new URL('src/', root);
const read = (path: string) => readFileSync(new URL(path, src), 'utf8');
const wrap = (body: string) => `@layer ${LAYER} {\n${body}}\n`;

// dist/styles.css: every file in the order of src/styles.css, in one layer block.
const files = styleFiles();
writeFileSync(new URL('styles.css', dist), `/* @seanyeh77/ui */\n${LAYER_ORDER}\n${wrap(files.map((f) => read(f.path)).join(''))}`);

// dist/css/: base.css (shared, first), <Name>.css per component, end.css (shared, last). A component file imports the
// files of the components whose classes it uses that come before it, so a bundler keeps the order of styles.css.
const css = new URL('css/', dist);
rmSync(css, { recursive: true, force: true });
mkdirSync(css);
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
// The component file that first gives each class a rule (as the subject of a selector).
const owner = new Map<string, string>();
for (const f of components)
  for (const m of read(f.path).matchAll(/([^{}]*)\{/g))
    for (const sel of m[1].split(','))
      for (const c of (
        sel
          .trim()
          .split(/[\s>+~]+/)
          .pop() ?? ''
      ).matchAll(/\.(ui-[\w-]+)/g))
        if (!owner.has(c[1])) owner.set(c[1], f.name);
const position = new Map(components.map((f, i) => [f.name, i]));
const at = (name: string) => position.get(name) ?? Infinity;
for (const f of components) {
  const dir = new URL(`components/${f.name}/`, src);
  const code = readdirSync(dir)
    .filter((n) => /\.tsx?$/.test(n) && !/\.(test|stories)\./.test(n))
    .map((n) => readFileSync(new URL(n, dir), 'utf8'))
    .join('\n');
  const deps = new Set<string>();
  for (const m of code.matchAll(/ui-[\w-]+/g)) {
    const o = owner.get(m[0]);
    if (o && o !== f.name) deps.add(o);
  }
  for (const m of code.matchAll(/from '\.\.\/(\w+)\/\1'/g)) if (position.has(m[1]) && m[1] !== f.name) deps.add(m[1]);
  const before = [...deps].filter((d) => at(d) < at(f.name)).sort((a, b) => at(a) - at(b));
  const imports = before.map((d) => `@import './${d}.css';\n`).join('');
  writeFileSync(new URL(`${f.name}.css`, css), `${LAYER_ORDER}\n${imports}${wrap(read(f.path))}`);
}

cpSync(new URL('dist/tokens.css', tokens), new URL('tokens.css', dist));
cpSync(new URL('fonts.css', tokens), new URL('fonts.css', dist));
cpSync(new URL('fonts', tokens), new URL('fonts', dist), { recursive: true });

const docs = new URL('docs/', root);
mkdirSync(docs, { recursive: true });
const componentDir = new URL('components/', src);
for (const name of readdirSync(componentDir)) {
  const readme = new URL(`${name}/README.md`, componentDir);
  if (existsSync(readme)) cpSync(readme, new URL(`${name}.md`, docs));
}
// The guides: the core rules (guidelines.md) and the topic files. decisions.md is history, not something to build from.
const guides = new URL('../../docs/', root);
for (const file of readdirSync(guides)) if (file.endsWith('.md') && file !== 'decisions.md') cpSync(new URL(file, guides), new URL(file, docs));
console.log(`postbuild: styles (${files.length} files, ${components.length} per component), tokens, fonts and docs copied`);
