// Writes src/generated/themeDefaults.ts from @seanyeh77/tokens' tokens.json: the default accent, the grounds setAccent
// falls back to, and each preset's id, color scheme and accent. theme.ts imports it, so these values live only in
// tokens.json. Runs before every build; `pnpm test` (theme-defaults.ts --check) fails when the checked-in file is out of date.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

interface Tok {
  name: string;
  value: string | { light: string; dark?: string };
}
const file = JSON.parse(readFileSync(new URL('../../tokens/tokens.json', import.meta.url), 'utf8')) as {
  color: { tokens: Tok[] };
  presets?: { id: string; scheme?: 'light' | 'dark'; values: Record<string, string> }[];
};
const pick = (name: string) => {
  const t = file.color.tokens.find((x) => x.name === name);
  if (!t) throw new Error('tokens.json has no color ' + name);
  return typeof t.value === 'string' ? { light: t.value, dark: t.value } : { light: t.value.light, dark: t.value.dark ?? t.value.light };
};
const grounds = Object.fromEntries(['bg', 'surface', 'surface-sub', 'surface-chrome', 'ink'].map((n) => [n, pick(n)]));
const presets = Object.fromEntries((file.presets ?? []).map((p) => [p.id, { scheme: p.scheme ?? 'light', accent: p.values.accent ?? pick('accent').light }]));

const raw = `/* Generated from packages/tokens/tokens.json by scripts/theme-defaults.ts. Do not edit by hand. */

/** The default accent (the light theme's accent token). */
export const DEFAULT_ACCENT = ${JSON.stringify(pick('accent').light)};

/** Light and dark values of the grounds setAccent checks contrast on, used when tokens.css is not loaded. */
export const GROUNDS = ${JSON.stringify(grounds, null, 2)} as const;

/** The presets of tokens.json: their color scheme and accent. */
export const PRESETS = ${JSON.stringify(presets, null, 2)} as const;

export type ThemePreset = keyof typeof PRESETS;
`;

const target = new URL('../src/generated/themeDefaults.ts', import.meta.url);
const source = await format(raw, { ...(await resolveConfig(fileURLToPath(target))), filepath: fileURLToPath(target) });

if (process.argv[2] === '--check') {
  if (readFileSync(target, 'utf8') !== source) {
    console.error('src/generated/themeDefaults.ts is out of date: run node scripts/theme-defaults.ts');
    process.exit(1);
  }
} else writeFileSync(target, source);
