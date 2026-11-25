/* After `changeset version`: rewrites the pinned release in AGENTS.md and README.md (the /dist/<version>/ URLs on the
   docs site and the @<version> URLs on jsDelivr) to the version of @seanyeh77/ui, so the copied snippets always load
   the release they were written for. `node scripts/pin-version.ts --check` fails when a file pins another version. */
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const { version } = JSON.parse(readFileSync(new URL('packages/ui/package.json', root), 'utf8')) as { version: string };
const check = process.argv.includes('--check');
const V = String.raw`\d+\.\d+\.\d+(?:-[\w.]+)?`;
const patterns = [new RegExp(String.raw`(/ui-design-system/dist/)${V}(/)`, 'g'), new RegExp(String.raw`(@seanyeh77/(?:ui|tokens)@)${V}()`, 'g')];
let stale = false;
for (const file of ['AGENTS.md', 'README.md']) {
  const url = new URL(file, root);
  const text = readFileSync(url, 'utf8');
  let next = text;
  for (const re of patterns) next = next.replace(re, `$1${version}$2`);
  if (next === text) continue;
  if (check) {
    console.error(`${file} pins another version than ${version}: run node scripts/pin-version.ts`);
    stale = true;
  } else {
    writeFileSync(url, next);
    console.log(`${file}: pinned ${version}`);
  }
}
if (stale) process.exit(1);
