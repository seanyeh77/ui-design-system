// Copies the CSS, the token files and the fonts next to the JavaScript in dist/, and the component READMEs and the guides into docs/
// so an agent can read them from node_modules/@seanyeh77/ui/docs.
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const tokens = new URL('../tokens/', root);
const dist = new URL('dist/', root);

cpSync(new URL('src/styles.css', root), new URL('styles.css', dist));
cpSync(new URL('dist/tokens.css', tokens), new URL('tokens.css', dist));
cpSync(new URL('fonts.css', tokens), new URL('fonts.css', dist));
cpSync(new URL('fonts', tokens), new URL('fonts', dist), { recursive: true });

const docs = new URL('docs/', root);
mkdirSync(docs, { recursive: true });
const components = new URL('src/components/', root);
for (const name of readdirSync(components)) {
  const readme = new URL(`${name}/README.md`, components);
  if (existsSync(readme)) cpSync(readme, new URL(`${name}.md`, docs));
}
// The guides: the core rules (guidelines.md) and the topic files. decisions.md is history, not something to build from.
const guides = new URL('../../docs/', root);
for (const file of readdirSync(guides)) if (file.endsWith('.md') && file !== 'decisions.md') cpSync(new URL(file, guides), new URL(file, docs));
console.log('postbuild: styles, tokens, fonts and docs copied');
