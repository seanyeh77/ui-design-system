// Fails when styles.css writes a literal where a token exists: a font size in px (the text-* scale), a z-index number
// (the z-* layers), or a transition or animation duration or easing that equals a dur-* or ease-* token.
// A deliberate one-off keeps its literal with `/* token-exempt: reason */` on the same line.
// Run: node scripts/check-css-tokens.ts (part of `pnpm test`).
import { readFileSync } from 'node:fs';

interface Token {
  name: string;
  value: string;
}
const root = new URL('../', import.meta.url);
const file = process.argv[2] ? new URL(process.argv[2], `file://${process.cwd()}/`) : new URL('src/styles.css', root);
const css = readFileSync(file, 'utf8');
const tokens: { motion: { tokens: Token[] } } = JSON.parse(readFileSync(new URL('../tokens/tokens.json', root), 'utf8'));

const ms = (v: string) => Math.round(parseFloat(v) * (v.endsWith('ms') ? 1 : 1000));
const durations = new Map<number, string>();
const easings = new Map<string, string>();
for (const t of tokens.motion.tokens) {
  if (t.name.startsWith('dur-')) durations.set(ms(t.value), t.name);
  else if (t.name.startsWith('ease-')) easings.set(t.value.replace(/\s+/g, ''), t.name);
}

const lines = css.split('\n');
const lineAt = (index: number) => css.slice(0, index).split('\n').length;
const problems: string[] = [];
const report = (index: number, message: string) => {
  const n = lineAt(index);
  if (!lines[n - 1].includes('token-exempt:')) problems.push(`styles.css:${n}: ${message}`);
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

if (problems.length) {
  console.error(
    `${problems.length} literal value(s) where a token exists:\n${problems.join('\n')}\nUse the token, or add /* token-exempt: reason */ on the line for a deliberate one-off.`,
  );
  process.exit(1);
}
console.log('styles.css: font sizes, z-index, durations and easings use tokens.');
