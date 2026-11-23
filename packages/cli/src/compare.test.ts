import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { PNG } from 'pngjs';
import { compareShots, DEFAULT_TOLERANCE, samePixels } from './compare.ts';
import { changedShots, compareWithBaselines, orphanBaselines, summaryMarkdown } from './shots.ts';

type RGB = [number, number, number];

/** A width x height opaque image in one color, with some pixels painted another color. */
function image(width: number, height: number, fill: RGB, paint: [number, number, RGB][] = []): Buffer {
  const png = new PNG({ width, height });
  for (let i = 0; i < width * height; i++) png.data.set([...fill, 255], i * 4);
  for (const [x, y, c] of paint) png.data.set([...c, 255], (y * width + x) * 4);
  return PNG.sync.write(png);
}

const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];
// 100 x 100 px = 10,000 px: the default 0.02 % allows 2 px.
const W = 100;

test('identical images are unchanged and give no diff image', () => {
  const c = compareShots(image(W, W, WHITE), image(W, W, WHITE));
  assert.equal(c.changed, false);
  assert.equal(c.diffPixels, 0);
  assert.equal(c.diff, undefined);
});

test('a color change under the per-pixel threshold does not count', () => {
  const c = compareShots(image(W, W, WHITE), image(W, W, [252, 252, 252]));
  assert.equal(c.diffPixels, 0);
  assert.equal(c.changed, false);
});

test('differing pixels up to the allowed share pass, with a diff image', () => {
  // Isolated pixels far apart, so none of them reads as anti-aliasing.
  const c = compareShots(
    image(W, W, WHITE),
    image(W, W, WHITE, [
      [10, 10, BLACK],
      [80, 80, BLACK],
    ]),
  );
  assert.equal(c.diffPixels, 2);
  assert.equal(c.diffPercent, 0.02);
  assert.equal(c.changed, false);
  assert.ok(c.diff);
});

test('more differing pixels than allowed is a change', () => {
  const block: [number, number, RGB][] = [];
  for (let x = 40; x < 50; x++) for (let y = 40; y < 50; y++) block.push([x, y, BLACK]);
  const c = compareShots(image(W, W, WHITE), image(W, W, WHITE, block));
  assert.ok(c.diffPixels >= 64, `${c.diffPixels} px`);
  assert.equal(c.changed, true);
  // The diff marks a changed pixel in red.
  assert.ok(c.diff);
  const d = PNG.sync.read(c.diff);
  const i = (45 * W + 45) * 4;
  assert.deepEqual([...d.data.subarray(i, i + 3)], [255, 0, 0]);
});

test('the tolerance is configurable', () => {
  const two = image(W, W, WHITE, [
    [10, 10, BLACK],
    [80, 80, BLACK],
  ]);
  assert.equal(compareShots(image(W, W, WHITE), two, { ...DEFAULT_TOLERANCE, maxDiffPercent: 0 }).changed, true);
  const grey = image(W, W, [200, 200, 200]);
  assert.equal(compareShots(image(W, W, WHITE), grey, { threshold: 0.5, maxDiffPercent: 0 }).changed, false);
  assert.equal(compareShots(image(W, W, WHITE), grey, { threshold: 0.05, maxDiffPercent: 0 }).changed, true);
});

test('a different size is always a change, even when the shared part is the same', () => {
  const c = compareShots(image(W, W, WHITE), image(W, W + 1, WHITE));
  assert.equal(c.changed, true);
  assert.deepEqual(c.sizes, { expected: [W, W], actual: [W, W + 1] });
  assert.equal(c.diffPixels, W);
  assert.ok(c.diff);
  const d = PNG.sync.read(c.diff);
  assert.deepEqual([d.width, d.height], [W, W + 1]);
});

test('samePixels ignores the encoding and sees one pixel', () => {
  const a = image(W, W, WHITE);
  // The same pixels written with other encoder settings: other bytes.
  const b = PNG.sync.write(PNG.sync.read(a), { colorType: 2, inputHasAlpha: true, deflateLevel: 1 });
  assert.notDeepEqual(a, b);
  assert.ok(samePixels(a, b));
  assert.equal(samePixels(a, image(W, W, WHITE, [[1, 1, [254, 255, 255]]])), false);
  assert.equal(samePixels(a, image(W, W + 1, WHITE)), false);
});

test('compareWithBaselines writes actual, expected and diff only for changed and new shots', () => {
  const base = mkdtempSync(join(tmpdir(), 'ui-base-'));
  const diff = join(mkdtempSync(join(tmpdir(), 'ui-diff-')), 'out');
  writeFileSync(join(base, 'A-390-light.png'), image(W, W, WHITE));
  writeFileSync(join(base, 'B-390-light.png'), image(W, W, WHITE));
  writeFileSync(join(base, 'Gone-390-light.png'), image(W, W, WHITE));
  const shots = new Map([
    ['A-390-light.png', image(W, W, WHITE)],
    ['B-390-light.png', image(W, W, BLACK)],
    ['C-390-light.png', image(W, W, WHITE)],
  ]);
  assert.deepEqual(changedShots(shots, base, DEFAULT_TOLERANCE), ['B-390-light.png', 'C-390-light.png']);
  assert.equal(existsSync(diff), false, 'changedShots writes nothing');
  const results = compareWithBaselines(shots, base, diff, DEFAULT_TOLERANCE);
  assert.deepEqual(
    results.map((r) => r.status),
    ['same', 'changed', 'new'],
  );
  assert.deepEqual(readdirSync(diff).sort(), ['B-390-light-actual.png', 'B-390-light-diff.png', 'B-390-light-expected.png', 'C-390-light-actual.png']);
  const orphans = orphanBaselines(base, new Set(shots.keys()));
  assert.deepEqual(orphans, ['Gone-390-light.png']);
  const md = summaryMarkdown(results, orphans, base);
  assert.match(md, /1 張改變、1 張沒有基準圖/);
  assert.match(md, /`B-390-light.png`: 10000 px differ/);
  assert.match(md, /Gone-390-light.png/);
});
