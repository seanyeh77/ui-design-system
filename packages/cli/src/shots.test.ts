import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isFileFontCors, jobsFor, stemFor } from './shots.ts';

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

test('the query is part of the name, so variants of one page do not overwrite each other', () => {
  assert.equal(stemFor('http://localhost:6006/iframe.html?id=button--primary&viewMode=story'), 'iframe-id-button-primary-viewMode-story');
  assert.notEqual(stemFor('http://localhost:6006/iframe.html?id=a--one'), stemFor('http://localhost:6006/iframe.html?id=a--two'));
  assert.equal(stemFor('file:///repo/site/preview/Tabs.html?state=open'), 'Tabs-state-open');
  assert.equal(stemFor('http://localhost:5173/settings?tab=billing#danger'), 'settings-tab-billing-danger');
  assert.doesNotMatch(stemFor('http://localhost:5173/?q=a/b:c'), /[/:]/);
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

test('a font blocked by CORS on a file:// page is recognized; the same error on a served page is not', () => {
  const cors =
    "Access to font at 'https://example.com/f.woff2' from origin 'null' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.";
  assert.equal(isFileFontCors('file:///tmp/p.html', cors, 'file:///tmp/p.html'), true);
  assert.equal(isFileFontCors('file:///tmp/p.html', 'Failed to load resource: net::ERR_FAILED', 'https://example.com/f.woff2'), true);
  assert.equal(isFileFontCors('file:///tmp/p.html', 'Failed to load resource: net::ERR_FAILED', 'https://example.com/app.js'), false);
  assert.equal(isFileFontCors('http://localhost:5173/', cors, 'http://localhost:5173/'), false);
  assert.equal(isFileFontCors('file:///tmp/p.html', 'TypeError: x is undefined', ''), false);
});
