// Turns tokens.json into dist/tokens.css, dist/tailwind.css and a typed dist/index.js + index.d.ts.
// Light values go on :root, dark values on [data-theme="dark"], each preset on [data-theme="<id>"]
// with only the values that differ from light. Run: pnpm --filter @seanyeh77/tokens build
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

type Value = string | { light: string; dark?: string };
interface Token {
  name: string;
  value: Value;
  /** text tokens only: the line height that goes with the size (Tailwind's text-* utilities set it too). */
  lineHeight?: string;
  usage?: string;
}
interface Preset {
  id: string;
  name: string;
  usage?: string;
  values: Record<string, string>;
}
interface TokenFile {
  color: { tokens: Token[] };
  spacing: { tokens: Token[] };
  radius: { tokens: Token[] };
  shadow: { tokens: Token[] };
  size: { tokens: Token[] };
  text: { tokens: Token[] };
  motion: { tokens: Token[] };
  layer: { tokens: Token[] };
  type: { families: Record<string, string> };
  presets?: Preset[];
}

const root = new URL('../', import.meta.url);
const file: TokenFile = JSON.parse(readFileSync(new URL('tokens.json', root), 'utf8'));
const GROUPS = ['color', 'spacing', 'radius', 'shadow', 'size', 'text', 'motion', 'layer'] as const;
const HEADER = '/* Generated from tokens.json by scripts/build.ts. Do not edit by hand. */\n';

const light: Record<string, string> = {};
const dark: Record<string, string> = {};
const groups: Record<string, string[]> = {};
for (const group of GROUPS) {
  groups[group] = [];
  for (const t of file[group].tokens) {
    const v = t.value;
    light[t.name] = typeof v === 'string' ? v : v.light;
    dark[t.name] = typeof v === 'string' ? light[t.name] : (v.dark ?? v.light);
    groups[group].push(t.name);
  }
}
groups.font = [];
for (const [key, value] of Object.entries(file.type.families)) {
  light['font-' + key] = dark['font-' + key] = value;
  groups.font.push('font-' + key);
}

const block = (selector: string, values: Record<string, string>, base?: Record<string, string>) =>
  `${selector} {\n${Object.entries(values)
    .filter(([k, v]) => !base || base[k] !== v)
    .map(([k, v]) => `  --${k}: ${v};`)
    .join('\n')}\n}\n`;

let blocks = block(':root', light) + block('[data-theme="dark"]', dark, light);
for (const preset of file.presets ?? []) {
  const unknown = Object.keys(preset.values).filter((k) => !(k in light));
  if (unknown.length) throw new Error(`preset ${preset.id}: unknown tokens ${unknown.join(', ')}`);
  blocks += block(`[data-theme="${preset.id}"]`, preset.values, light);
}
// In the system's layer (ui.tokens, below the component styles): a page's own unlayered :root { --accent: … } always
// wins, whatever the order of the files. The first statement places Tailwind's layers around it when loaded first.
const css = `${HEADER}@layer theme, base, ui, components, utilities;\n@layer ui.tokens, ui.components;\n@layer ui.tokens {\n${blocks}}\n`;

// Tailwind v4: colors point at the runtime variables so themes keep working (bg-surface, text-ink-muted).
// Shadows too: Tailwind copies a plain @theme shadow value into the utility, which would ignore dark and presets.
// Radius and font names are the same as Tailwind's own namespaces and compile to var(--radius-md), so they get
// the light value here and tokens.css (layer ui, after Tailwind's theme layer) overrides them per theme. Text sizes (text-body) carry their line
// height; easings are ease-standard and the like. Durations and z layers have no Tailwind namespace: duration-(--dur-hover).
const twVars = [
  ...groups.color.map((n) => `  --color-${n}: var(--${n});`),
  ...groups.spacing.map((n) => `  --spacing-${n.replace('space-', '')}: var(--${n});`),
  ...groups.shadow.map((n) => `  --${n}: var(--${n});`),
];
const lineHeights = Object.fromEntries(file.text.tokens.map((t) => [t.name, t.lineHeight]));
const twValues = [
  ...groups.radius.map((n) => `  --${n}: ${light[n]};`),
  ...groups.font.map((n) => `  --${n}: ${light[n]};`),
  ...groups.text.flatMap((n) => [`  --${n}: ${light[n]};`, ...(lineHeights[n] ? [`  --${n}--line-height: ${lineHeights[n]};`] : [])]),
  ...groups.motion.filter((n) => n.startsWith('ease-')).map((n) => `  --${n}: ${light[n]};`),
];
// inline: utilities read var(--bg) where they are used, so a nested data-theme still switches them.
const tailwind = `${HEADER}/* Use after @import "tailwindcss". Also load tokens.css: the color, spacing and shadow utilities read its variables. Put @layer theme, base, ui, components, utilities; first, so utilities override the components. */\n@theme inline {\n${twVars.join('\n')}\n}\n@theme {\n${twValues.join('\n')}\n}\n`;

const union = (names: string[]) => names.map((n) => `'${n}'`).join(' | ');
const dts = `${HEADER.replace('/*', '/**')}
export type ColorToken = ${union(groups.color)};
export type SpaceToken = ${union(groups.spacing)};
export type RadiusToken = ${union(groups.radius)};
export type ShadowToken = ${union(groups.shadow)};
export type SizeToken = ${union(groups.size)};
export type FontToken = ${union(groups.font)};
export type TextToken = ${union(groups.text)};
export type MotionToken = ${union(groups.motion)};
export type LayerToken = ${union(groups.layer)};
export type Token = ColorToken | SpaceToken | RadiusToken | ShadowToken | SizeToken | FontToken | TextToken | MotionToken | LayerToken;
export type ThemeId = 'light' | 'dark'${(file.presets ?? []).map((p) => ` | '${p.id}'`).join('')};
/** Light values; read the live value with getComputedStyle when the theme matters. */
export declare const tokens: Readonly<Record<Token, string>>;
/** \`var(--name)\` for inline styles: \`style={{ color: cssVar('ink-muted') }}\`. Only token names compile. */
export declare function cssVar(name: Token): string;
`;
const js = `${HEADER}export const tokens = Object.freeze(${JSON.stringify(light, null, 2)});
export function cssVar(name) { return 'var(--' + name + ')'; }
`;

const out = new URL('dist/', root);
mkdirSync(out, { recursive: true });
writeFileSync(new URL('tokens.css', out), css);
writeFileSync(new URL('tailwind.css', out), tailwind);
writeFileSync(new URL('index.js', out), js);
writeFileSync(new URL('index.d.ts', out), dts);
console.log(`tokens: ${Object.keys(light).length} tokens → dist/tokens.css, tailwind.css, index.js, index.d.ts`);
