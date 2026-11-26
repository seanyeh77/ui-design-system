/* Lists the changed files that can change what a preview looks like, and the previews that may change, so you know
   whether a change needs ui shots and the Update visual baselines workflow (docs/maintaining.md, 發布).
   Compares with the merge base of origin/main, including uncommitted and untracked files:
   `pnpm changed:visual [ref]`. Prints only; it never fails. CI still compares every preview, so a change wrongly called
   non-visual fails CI on main and is never published. */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const ref = process.argv[2] ?? 'origin/main';
const base = git('merge-base', 'HEAD', ref);
const files = [...new Set([...git('diff', '--name-only', base).split('\n'), ...git('ls-files', '--others', '--exclude-standard').split('\n')])].filter(Boolean);

const COMP = 'packages/ui/src/components/';
const components = readdirSync(new URL(COMP, root), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
const withPreview = components.filter((n) => existsSync(new URL(`${COMP}${n}/preview.html`, root)));

// Files that never change a rendered page: docs, stories, tests, changesets, the lint rules, CI and the other scripts.
const notVisual = (f: string) =>
  /\.(md|test\.tsx?|stories\.tsx)$/.test(f) ||
  /^(docs|labs|apps|\.changeset|\.github|tests|packages\/eslint-plugin-ui|packages\/blocks)\//.test(f) ||
  (f.startsWith('packages/cli/') && !/^packages\/cli\/src\/(shots|compare)\.ts$/.test(f)) ||
  (f.startsWith('scripts/') && f !== 'scripts/site.ts') ||
  /^(AGENTS\.md|CLAUDE\.md|README\.md|LICENSE|eslint\.config\.js|registry\.json|\.prettier\w*)$/.test(f) ||
  /\/(CHANGELOG\.md|vitest\.config\.ts|tsconfig\.json)$/.test(f) ||
  f === 'package.json' ||
  (/^packages\/[^/]+\/package\.json$/.test(f) && onlyVersion(f));

// A package.json whose only change is its version (pnpm version-packages): dependencies did not change.
function onlyVersion(f: string) {
  const lines = git('diff', '-U0', base, '--', f)
    .split('\n')
    .filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---) /.test(l));
  return lines.length > 0 && lines.every((l) => /^[+-]\s*"version":/.test(l));
}

// Everything else outside one component's folder can change every preview: tokens, fonts, the shared CSS and code,
// the site's preview <head>, how shots are taken, and dependencies.
const all: string[] = [];
const touched = new Set<string>();
for (const f of files) {
  if (notVisual(f)) continue;
  const m = f.startsWith(COMP) ? f.slice(COMP.length).match(/^([^/]+)\//) : null;
  if (m && components.includes(m[1])) touched.add(m[1]);
  else all.push(f);
}

// A component's markup is also part of the components that import it.
const importers = new Map<string, Set<string>>();
for (const n of components) {
  for (const file of readdirSync(new URL(`${COMP}${n}/`, root))) {
    if (!/\.tsx?$/.test(file) || /\.(test|stories)\.tsx?$/.test(file)) continue;
    const src = readFileSync(new URL(`${COMP}${n}/${file}`, root), 'utf8');
    for (const [, dep] of src.matchAll(/from '\.\.\/([A-Za-z]+)\//g)) {
      if (dep === n) continue;
      const set = importers.get(dep) ?? new Set<string>();
      set.add(n);
      importers.set(dep, set);
    }
  }
}
const affected = new Set(touched);
for (const n of affected) for (const user of importers.get(n) ?? []) affected.add(user);

const previews = all.length
  ? withPreview
  : withPreview.filter((p) => {
      if (affected.has(p)) return true;
      // A preview that uses an affected component directly (UI.Name, or Name taken from UI).
      const html = readFileSync(new URL(`${COMP}${p}/preview.html`, root), 'utf8');
      return [...affected].some((n) => new RegExp(String.raw`\b${n}\b`).test(html));
    });

const visualFiles = files.filter((f) => !notVisual(f));
if (!visualFiles.length) {
  console.log(`沒有視覺變更（和 ${ref} 比較 ${files.length} 個檔案）：不用跑 ci-shots 和 Update visual baselines，直接 push main。`);
} else {
  console.log(`視覺變更（和 ${ref} 比較）：`);
  for (const f of visualFiles) console.log(`  ${f}`);
  console.log(all.length ? `\n這些檔案會影響所有預覽（${previews.length} 個）。` : `\n可能改變的預覽（${previews.length} 個）：${previews.join(', ')}`);
  console.log('先推到 ci-shots 跑 Update visual baselines，看過 diff 後再快轉 main。');
}
