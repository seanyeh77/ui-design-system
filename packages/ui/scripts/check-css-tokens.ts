// Fails when a style file (every file src/styles.css lists) writes a literal where a token exists: a font size in px (the text-* scale), a z-index number
// (the z-* layers), or a transition or animation duration or easing that equals a dur-* or ease-* token.
// A deliberate one-off keeps its literal with `/* token-exempt: reason */` on the same line.
// Also fails when a .css file under src/components or src/styles is missing from src/styles.css, and when a rule has a
// -webkit- property after its standard one, or -webkit-backdrop-filter without backdrop-filter: a minifier
// (lightningcss) keeps only the last of the pair, so the standard one must come last (checked in the built CSS too).
// Run: node scripts/check-css-tokens.ts [file] (part of `pnpm test`).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { styleFiles } from './styles.ts';

interface Token {
  name: string;
  value: string;
}
const root = new URL('../', import.meta.url);
const tokens: { motion: { tokens: Token[] } } = JSON.parse(readFileSync(new URL('../tokens/tokens.json', root), 'utf8'));

const ms = (v: string) => Math.round(parseFloat(v) * (v.endsWith('ms') ? 1 : 1000));
const durations = new Map<number, string>();
const easings = new Map<string, string>();
for (const t of tokens.motion.tokens) {
  if (t.name.startsWith('dur-')) durations.set(ms(t.value), t.name);
  else if (t.name.startsWith('ease-')) easings.set(t.value.replace(/\s+/g, ''), t.name);
}

const problems: string[] = [];
const listed = styleFiles().map((f) => f.path);
const files = process.argv[2] ? [new URL(process.argv[2], `file://${process.cwd()}/`)] : listed.map((p) => new URL(`src/${p}`, root));
if (!process.argv[2]) {
  const src = new URL('src/', root);
  const onDisk = [
    ...readdirSync(new URL('styles/', src)).map((n) => `styles/${n}`),
    ...readdirSync(new URL('components/', src), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((d) => readdirSync(new URL(`components/${d.name}/`, src)).map((n) => `components/${d.name}/${n}`)),
  ].filter((p) => p.endsWith('.css'));
  for (const p of onDisk) if (!listed.includes(p)) problems.push(`src/${p}: not in src/styles.css, so it is not built`);
}
for (const file of files) checkFile(file);
// The built files, when there are any (pnpm check builds before it tests).
const css = new URL('dist/css/', root);
if (!process.argv[2] && existsSync(css))
  for (const file of [new URL('dist/styles.css', root), ...readdirSync(css).map((n) => new URL(n, css))])
    checkPrefixes(readFileSync(file, 'utf8'), file.pathname.split('/packages/ui/').pop() ?? '');

/** Each rule block: a -webkit- property comes before its standard one, and -webkit-backdrop-filter has one. */
function checkPrefixes(
  css: string,
  name: string,
  report: (index: number, message: string) => void = (_index, message) => {
    problems.push(`${name}: ${message}`);
  },
) {
  const code = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  for (const block of code.matchAll(/\{[^{}]*\}/g)) {
    for (const m of block[0].matchAll(/(?<![-\w])-webkit-([\w-]+)\s*:/g)) {
      const standard = new RegExp(`(?<![-\\w])${m[1]}\\s*:`).exec(block[0]);
      const at = (block.index ?? 0) + (m.index ?? 0);
      if (standard && standard.index < (m.index ?? 0)) report(at, `-webkit-${m[1]} after ${m[1]}: put it first, or a minifier drops ${m[1]}`);
      if (!standard && m[1] === 'backdrop-filter') report(at, '-webkit-backdrop-filter without backdrop-filter: add the standard property after it');
    }
  }
}

function checkFile(file: URL) {
  const css = readFileSync(file, 'utf8');
  const name = file.pathname.split('/src/').pop();
  const lines = css.split('\n');
  const lineAt = (index: number) => css.slice(0, index).split('\n').length;
  const report = (index: number, message: string) => {
    const n = lineAt(index);
    if (!lines[n - 1].includes('token-exempt:')) problems.push(`${name}:${n}: ${message}`);
  };

  checkPrefixes(css, name ?? '', report);
  // Comments out, same length, so positions still match lines.
  const code = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  for (const m of code.matchAll(/(?<![-\w])(font-size|z-index|transition|transition-duration|animation|animation-duration)\s*:\s*([^;{}]*)/g)) {
    const [, prop, value] = m;
    const at = (m.index ?? 0) + m[0].indexOf(value);
    if (prop === 'font-size') {
      for (const px of value.matchAll(/(?<![\w.-])\d*\.?\d+px\b/g))
        report(at + (px.index ?? 0), `font-size ${px[0]}: use var(--text-*) (text scale in tokens.json)`);
    } else if (prop === 'z-index') {
      // calc(var(--z-modal) + 1) is an offset from a layer; only a bare number is a literal layer.
      if (/^\s*-?\d+\s*$/.test(value)) report(at, `z-index ${value.trim()}: use var(--z-*) (layer scale in tokens.json)`);
    } else {
      for (const t of value.matchAll(/(?<![\w.-])(\d*\.?\d+)(ms|s)\b/g)) {
        const name = durations.get(ms(t[0]));
        if (name) report(at + (t.index ?? 0), `${prop} ${t[0]}: use var(--${name})`);
      }
      for (const e of value.matchAll(/cubic-bezier\([^)]*\)/g)) {
        const name = easings.get(e[0].replace(/\s+/g, ''));
        if (name) report(at + (e.index ?? 0), `${prop} ${e[0]}: use var(--${name})`);
      }
    }
  }
}

if (problems.length) {
  console.error(
    `${problems.length} problem(s) in the style files:\n${problems.join('\n')}\nUse the token, or add /* token-exempt: reason */ on the line for a deliberate one-off; put a -webkit- property before its standard one.`,
  );
  process.exit(1);
}
console.log(`${files.length} style files: font sizes, z-index, durations and easings use tokens; -webkit- properties come first.`);
