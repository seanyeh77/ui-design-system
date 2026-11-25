import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { addReport, defaultDir, writeTemplate, type Template } from './add.ts';

const registry = JSON.parse(readFileSync(new URL('../../../registry.json', import.meta.url), 'utf8')) as { items: { name: string }[] };

test('dist/templates.json carries every template of registry.json, with the same file contents', () => {
  const templates = JSON.parse(readFileSync(new URL('../dist/templates.json', import.meta.url), 'utf8')) as Template[];
  assert.deepEqual(
    templates.map((t) => t.name),
    registry.items.map((i) => i.name),
  );
  for (const t of templates)
    for (const f of t.files) assert.ok(f.content.includes('@seanyeh77/ui') || f.content.includes('import type'), `${t.name}: ${f.target} looks empty`);
});

const t: Template = {
  name: 'demo',
  title: 'Demo',
  description: '',
  dependencies: ['@seanyeh77/ui'],
  files: [
    { target: 'components/blocks/demo/Demo.tsx', content: 'a' },
    { target: 'components/blocks/demo/sample.ts', content: 'b' },
  ],
};

test('the default folder follows the project: src/components/blocks/<name> when there is a src folder', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'ui-add-'));
  assert.equal(defaultDir('demo', cwd), join('components', 'blocks', 'demo'));
  mkdirSync(join(cwd, 'src'));
  assert.equal(defaultDir('demo', cwd), join('src', 'components', 'blocks', 'demo'));
});

test('writeTemplate writes the files and keeps existing ones unless forced', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'ui-add-'));
  const dir = join(cwd, 'blocks');
  assert.deepEqual(writeTemplate(t, dir, false).written.length, 2);
  writeFileSync(join(dir, 'Demo.tsx'), 'mine');
  const again = writeTemplate(t, dir, false);
  assert.equal(again.skipped.length, 2);
  assert.equal(readFileSync(join(dir, 'Demo.tsx'), 'utf8'), 'mine');
  writeTemplate(t, dir, true);
  assert.equal(readFileSync(join(dir, 'Demo.tsx'), 'utf8'), 'a');
  const report = addReport(t, dir, again, cwd).join('\n');
  assert.match(report, /npm i @seanyeh77\/ui/);
  assert.match(report, /<Demo … \/> from blocks\/Demo\.tsx/);
  assert.match(report, /sample\.ts has example data/);
});
