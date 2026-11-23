// Fails when a style file (every file src/styles.css lists) writes a literal where a token exists: a font size in px (the text-* scale), a z-index number
// (the z-* layers), or a transition or animation duration or easing that equals a dur-* or ease-* token.
// A deliberate one-off keeps its literal with `/* token-exempt: reason */` on the same line.
// Also fails when a .css file under src/components or src/styles is missing from src/styles.css.
// Run: node scripts/check-css-tokens.ts [file] (part of `pnpm test`).
import { readdirSync, readFileSync } from 'node:fs';
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

function checkFile(file: URL) {
  const css = readFileSync(file, 'utf8');
  const name = file.pathname.split('/src/').pop();
  const lines = css.split('\n');
  const lineAt = (index: number) => css.slice(0, index).split('\n').length;
  const report = (index: number, message: string) => {
    const n = lineAt(index);
    if (!lines[n - 1].includes('token-exempt:')) problems.push(`${name}:${n}: ${message}`);
  };

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
    `${problems.length} problem(s) in the style files:\n${problems.join('\n')}\nUse the token, or add /* token-exempt: reason */ on the line for a deliberate one-off.`,
  );
  process.exit(1);
}
console.log(`${files.length} style files: font sizes, z-index, durations and easings use tokens.`);
