import assert from 'node:assert/strict';
import { test } from 'node:test';
import { jobsFor, stemFor } from './shots.ts';

test('a file is named after its file name', () => {
  assert.equal(stemFor('file:///repo/site/preview/Button.html'), 'Button');
  assert.equal(stemFor('file:///tmp/my%20page.html'), 'my-page');
});

test('a page on a server is named after its path and hash, with no colon', () => {
  assert.equal(stemFor('http://localhost:5173/'), 'index');
  assert.equal(stemFor('http://localhost:5173/settings#billing'), 'settings-billing');
  assert.equal(stemFor('http://localhost:5173/projects/42/edit'), 'projects-42-edit');
  assert.equal(stemFor('http://localhost:5173/#/users/7'), 'index-users-7');
  assert.equal(stemFor('https://example.com/docs/intro.html'), 'docs-intro');
  assert.doesNotMatch(stemFor('http://localhost:5173/a:b'), /:/);
});

test('two pages of one host get different names; the same name twice gets -2', () => {
  const jobs = jobsFor(['http://localhost:5173/', 'http://localhost:5173/settings', 'http://localhost:4000/settings'], (t) => t);
  assert.deepEqual(
    jobs.map((j) => j.stem),
    ['index', 'settings', 'settings-2'],
  );
});

test('ui and cli pin the same exact Playwright version (the screenshot baselines are made with its Chromium)', async () => {
  const { readFileSync } = await import('node:fs');
  const read = (p: string) =>
    JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  const cli = read('../package.json').dependencies?.playwright;
  const ui = read('../../ui/package.json').devDependencies?.playwright;
  assert.match(cli ?? '', /^\d+\.\d+\.\d+$/, 'packages/cli: playwright must be an exact version');
  assert.equal(cli, ui, 'packages/ui and packages/cli must pin the same playwright version; upgrading it means regenerating the visual baselines');
});
