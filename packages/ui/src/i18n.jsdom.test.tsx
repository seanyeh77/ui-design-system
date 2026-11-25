// Every built-in text passed to tr() as a literal has an English entry, so the English interface has no Chinese left.
// Read from the source files (node's fs), so a new tr('…') without a translation fails here.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { I18N } from './i18n';

const SRC = import.meta.dirname + '/';

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return sources(p);
    return /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$/.test(f) ? [p] : [];
  });
}

test('i18n: every literal passed to tr() has an English entry', () => {
  const en = I18N.messages.en;
  const has = (k: string) => k in en || (k.includes('::') && k.slice(k.indexOf('::') + 2) in en);
  const literals: string[] = [];
  const missing: string[] = [];
  for (const file of sources(SRC)) {
    const text = readFileSync(file, 'utf8');
    // tr('…') or tr("…") with the literal as the whole first argument; byCount('one', 'many') passes both to tr().
    const calls = [...text.matchAll(/\btr\(\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1\s*[,)]/g)].map((m) => m[2]);
    const counts = [...text.matchAll(/\bbyCount\([^,]+,\s*'([^']*)',\s*'([^']*)'\)/g)].flatMap((m) => [m[1], m[2]]);
    for (const k of [...calls, ...counts]) {
      literals.push(k);
      if (!has(k)) missing.push(`${file.slice(SRC.length)}: ${k}`);
    }
  }
  expect(literals.length).toBeGreaterThan(100);
  expect(missing).toEqual([]);
});
