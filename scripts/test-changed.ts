/* Runs only the tests a change can affect, for the local run before a push (docs/maintaining.md, 發布); CI runs the
   whole suite. Compares with the merge base of origin/main, including uncommitted and untracked files:
   `pnpm test:changed [ref]`; `--list` prints the commands without running them.
   - @seanyeh77/ui: the fast checks of its `test` script, then the test files of each changed component's folder, the
     other test files that name the component (a11y, touch, overlays…), the changed test files and the jsdom render of
     every story. Not `vitest --changed`: almost every test imports src/index.ts, which imports every component, so
     it would run the whole suite for any change. A change outside the component folders (shared code and CSS, tokens,
     dependencies, test setup) runs the whole ui suite.
   - @seanyeh77/eslint-plugin-ui: `vitest run --changed` (its tests import only the rule they test).
   - @seanyeh77/ui-cli: the whole suite (node --test, about 10 s) when anything in packages/cli changed.
   The browser tests need Chromium: `npx playwright install chromium`, or CHROMIUM_PATH. */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const args = process.argv.slice(2);
const list = args.includes('--list');
const ref = args.find((a) => !a.startsWith('--')) ?? 'origin/main';
const base = git('merge-base', 'HEAD', ref);
const files = [...new Set([...git('diff', '--name-only', base).split('\n'), ...git('ls-files', '--others', '--exclude-standard').split('\n')])].filter(Boolean);
// A release commit changes every package's version and CHANGELOG: neither reaches a test.
const code = files.filter((f) => !f.endsWith('.md') && !(/^packages\/[^/]+\/package\.json$/.test(f) && versionOnly(f)));
const changed = (re: RegExp) => code.some((f) => re.test(f));

const run = (dir: string, cmd: string, argv: string[]) => {
  console.log(`\n> ${dir}: ${cmd} ${argv.join(' ')}`);
  if (!list) execFileSync(cmd, argv, { cwd: new URL(dir, root), stdio: 'inherit' });
};
let ran = 0;

// ui: which tests a change reaches.
const UI = 'packages/ui/';
const COMP = `${UI}src/components/`;
const notCode = (f: string) => /\.(md|stories\.tsx)$/.test(f) || /\/preview\.html$/.test(f) || f === `${UI}CHANGELOG.md`;
const uiFiles = code.filter((f) => f.startsWith(UI) && !notCode(f));
const comps = new Set<string>();
const tests = new Set<string>();
let uiAll = changed(/^(packages\/tokens\/|pnpm-lock\.yaml$|packages\/ui\/package\.json$)/);
for (const f of uiFiles) {
  const rel = f.slice(UI.length);
  if (f === `${UI}package.json`) continue;
  if (/\.test\.tsx?$/.test(f)) tests.add(rel);
  else if (f.startsWith(COMP) && /^[A-Z]\w*\//.test(f.slice(COMP.length))) comps.add(f.slice(COMP.length).split('/')[0]);
  else uiAll = true;
}
if (comps.size && !uiAll) {
  const all = git('ls-files', `${UI}src/*.test.ts`, `${UI}src/*.test.tsx`).split('\n').filter(Boolean);
  for (const f of all) {
    const rel = f.slice(UI.length);
    if (!existsSync(new URL(f, root))) continue;
    const own = [...comps].some((c) => f.startsWith(`${COMP}${c}/`));
    const text = readFileSync(new URL(f, root), 'utf8');
    if (own || [...comps].some((c) => new RegExp(String.raw`\b${c}\b`).test(text))) tests.add(rel);
  }
  tests.add('src/components.jsdom.test.tsx');
}
if (uiAll || tests.size) {
  run('packages/ui', 'node', ['scripts/check-css-tokens.ts']);
  run('packages/ui', 'node', ['scripts/theme-defaults.ts', '--check']);
  run('packages/ui', 'node', ['scripts/check-jsdoc.ts']);
  run('packages/ui', 'npx', ['vitest', 'run', ...(uiAll ? [] : [...tests].sort())]);
  ran++;
}

if (changed(/^(packages\/eslint-plugin-ui\/|pnpm-lock\.yaml$)/)) {
  run('packages/eslint-plugin-ui', 'npx', ['vitest', 'run', '--config', 'vitest.config.ts', '--changed', base, '--passWithNoTests']);
  ran++;
}
if (changed(/^(packages\/cli\/|pnpm-lock\.yaml$)/)) {
  run('packages/cli', 'node', [
    '--test',
    ...git('ls-files', 'packages/cli/src/*.test.ts')
      .split('\n')
      .map((f) => f.slice('packages/cli/'.length)),
  ]);
  ran++;
}
console.log(
  ran
    ? `\ntest:changed：${ran} 個套件的相關測試${list ? '（只列出，沒有執行）' : '通過'}（和 ${ref} 比較 ${files.length} 個檔案）。`
    : `\ntest:changed：沒有改到有測試的套件（和 ${ref} 比較 ${files.length} 個檔案）。`,
);

// A package.json whose only change is its version (pnpm version-packages).
function versionOnly(f: string) {
  const lines = git('diff', '-U0', base, '--', f)
    .split('\n')
    .filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---) /.test(l));
  return lines.length > 0 && lines.every((l) => /^[+-]\s*"version":/.test(l));
}
