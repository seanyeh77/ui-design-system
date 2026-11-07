/* ESLint rules that keep code written against @seanyeh77/ui on the design system's rules.
   Each message says what is wrong and what to use instead.

   // eslint.config.js
   import ui from '@seanyeh77/eslint-plugin-ui';
   export default [ui.configs.recommended];                                                     */
import type { ESLint, Linter, Rule } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import pkg from '../package.json' with { type: 'json' };

type Node = Rule.Node;
const valueOf = (n: Node): unknown => (n as unknown as { value?: unknown }).value;
type JSXAttr = { type: string; name: { name: string }; value: null | { type: string; value?: unknown; expression?: { type: string; value?: unknown } } };
type JSXOpening = { name: { type: string; name?: string; property?: { name: string } }; attributes: JSXAttr[] };
type JSXElementNode = { type: 'JSXElement'; openingElement: JSXOpening; children: unknown[]; parent?: JSXElementNode };

const COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(/;
// url(#fade) points at an SVG id, not a color.
const URL_REF = /url\(\s*['"]?#[^)]*\)/g;
const NAMED =
  /^(black|white|red|green|blue|yellow|orange|purple|pink|gray|grey|brown|cyan|magenta|navy|teal|maroon|olive|lime|aqua|fuchsia|silver|gold|indigo|violet|crimson|tomato|coral|salmon|khaki|beige|ivory|lavender|tan|darkgray|darkgrey|lightgray|lightgrey|darkblue|lightblue|darkred|darkgreen|lightgreen)$/i;
const COLOR_KEY = /color|background|fill|stroke|border|outline|shadow/i;
// Tailwind arbitrary values: bg-[#fff], text-[rgb(0,0,0)].
const ARBITRARY = /-\[(#|rgba?\(|hsla?\(|oklch\()/;

function tagName(el: JSXOpening): string {
  const n = el.name;
  if (n.type === 'JSXIdentifier') return n.name ?? '';
  if (n.type === 'JSXMemberExpression') return n.property?.name ?? '';
  return '';
}

function attr(el: JSXOpening, name: string): JSXAttr | undefined {
  return el.attributes.find((a) => a.type === 'JSXAttribute' && a.name?.name === name);
}

function literal(a: JSXAttr | undefined): unknown {
  if (!a?.value) return a ? true : undefined;
  if (a.value.type === 'Literal') return a.value.value;
  if (a.value.type === 'JSXExpressionContainer' && a.value.expression?.type === 'Literal') return a.value.expression.value;
  return undefined;
}

function textOf(el: JSXElementNode): string {
  return el.children
    .map((c) => {
      const n = c as { type: string; value?: string; expression?: { type: string; value?: unknown } };
      if (n.type === 'JSXText') return n.value ?? '';
      if (n.type === 'JSXExpressionContainer' && n.expression?.type === 'Literal') return String(n.expression.value);
      return '\u0000';
    })
    .join('')
    .trim();
}

// Tailwind's own palette, radii and shadows still compile next to the design system's theme. The theme keeps
// neutral-*, rounded-sm/chip/md/lg/full and shadow-sm/chip/card/card-hover/overlay; everything below is Tailwind's.
const TW_PALETTE = 'slate|gray|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const TW_COLOR = new RegExp(
  `^(bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|inset-ring|outline|divide(?:-[xy])?|fill|stroke|from|via|to|placeholder|decoration|caret|accent|shadow|inset-shadow|drop-shadow|text-shadow)-(?:(?:${TW_PALETTE})-(?:50|[1-9]00|950)|white|black)(?:/(?:[\\d.]+|\\[[^\\]]+\\]|\\([^)]+\\)))?$`,
);
// The bare rounded and shadow are Tailwind's fixed defaults too.
const TW_RADIUS = /^rounded(?:-[trblse]{1,2})?(?:-(?:xs|xl|2xl|3xl|4xl))?$/;
const TW_SHADOW = /^(?:shadow|drop-shadow|inset-shadow)(?:-(?:2xs|xs|md|lg|xl|2xl|inner))?$/;
const CLASS_FNS = 'cn|clsx|cx|cva|twMerge|twJoin|tv|classnames';
// A literal inside className={cn(…)} is already checked by the JSX visitor.
const hasJsxClassAncestor = (n: Node) => {
  for (let p: Node | null = n.parent; p; p = p.parent) {
    const a = p as unknown as { type: string; name?: { name?: string } };
    if (a.type === 'JSXAttribute') return a.name?.name === 'className' || a.name?.name === 'class';
  }
  return false;
};
const TOKEN_HINT: Record<string, string> = {
  text: 'text-ink, text-ink-muted, text-accent-text, text-danger-text, text-on-accent',
  bg: 'bg-surface, bg-surface-sub, bg-accent, bg-accent-soft, bg-danger-soft',
  border: 'border-line, border-line-strong, border-accent',
};
const twClasses = (v: string) =>
  v
    .split(/\s+/)
    .filter(Boolean)
    // hover:dark:!bg-gray-100 and bg-gray-100! → bg-gray-100
    .map((c) => c.slice(c.lastIndexOf(':') + 1).replace(/^!|!$/g, ''));

const noTailwindDefaults: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: { description: "Disallow Tailwind's default palette, radii and shadows: use the design system's token classes." },
    schema: [],
  },
  create(context) {
    const check = (node: Node, v: string) => {
      for (const c of twClasses(v)) {
        const color = TW_COLOR.exec(c);
        if (color) {
          const kind = color[1].startsWith('border') ? 'border' : color[1];
          context.report({
            node,
            message: "{{c}} is Tailwind's palette, not a design-system color. Use a token class: {{hint}}.",
            data: { c, hint: TOKEN_HINT[kind] ?? `${color[1]}-ink, ${color[1]}-accent, ${color[1]}-line` },
          });
        } else if (TW_RADIUS.test(c))
          context.report({ node, message: '{{c}} is not a design-system radius. Use rounded-sm, rounded-md or rounded-lg.', data: { c } });
        else if (TW_SHADOW.test(c))
          context.report({ node, message: '{{c}} is not a design-system shadow. Use shadow-card, shadow-overlay or shadow-sm.', data: { c } });
      }
    };
    return {
      'JSXAttribute[name.name=/^(className|class)$/] Literal'(node: Node) {
        const v = valueOf(node);
        if (typeof v === 'string') check(node, v);
      },
      'JSXAttribute[name.name=/^(className|class)$/] TemplateElement'(node: Node) {
        check(node, (node as unknown as { value: { cooked: string | null } }).value.cooked ?? '');
      },
      // Class strings built outside JSX: cn(), clsx(), cva() and friends.
      [`CallExpression[callee.name=/^(${CLASS_FNS})$/] Literal`](node: Node) {
        if (node.parent?.type === 'MemberExpression' || hasJsxClassAncestor(node)) return;
        const v = valueOf(node);
        if (typeof v === 'string') check(node, v);
      },
    };
  },
};

const noRawColor: Rule.RuleModule = {
  meta: { type: 'problem', docs: { description: 'Colors come from tokens: var(--ink) or cssVar("ink"), never a hex, rgb() or hsl() value.' }, schema: [] },
  create(context) {
    const check = (node: Node, value: string, key = '') => {
      if (COLOR.test(value.replace(URL_REF, '')) || (COLOR_KEY.test(key) && NAMED.test(value.trim())))
        context.report({
          node,
          message:
            'Hard-coded color "{{v}}". Use a token: var(--ink-muted) in CSS, cssVar("ink-muted") from @seanyeh77/tokens in style props, or a component prop.',
          data: { v: value.slice(0, 40) },
        });
    };
    return {
      // Any string under style, also inside ternaries and ?? / && (status colors); the key is the nearest property's.
      'JSXAttribute[name.name="style"] Literal'(node: Node) {
        const v = valueOf(node);
        if (typeof v !== 'string') return;
        // tone['red'] or tone[ok ? 'green' : 'red'] is a lookup key, not a value. A color name counts only where it
        // becomes the value (through ?:, &&, ??, as); s === 'red' or ['red'].includes(s) only compares a status.
        let p: Node | null = node.parent;
        let isValue = true;
        for (let c: Node = node; p && p.type !== 'Property'; c = p, p = p.parent) {
          const m = p as unknown as { type: string; computed?: boolean; property?: unknown; test?: unknown };
          if (m.type === 'MemberExpression' && m.computed && m.property === c) return;
          const passes =
            (m.type === 'ConditionalExpression' && m.test !== c) ||
            ['LogicalExpression', 'TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression'].includes(m.type);
          if (!passes) isValue = false;
        }
        if (!p) return;
        const key = (p as unknown as { key?: Node & { name?: string; value?: unknown } }).key;
        if (key === node) return;
        check(node, v, isValue ? String(key?.name ?? key?.value ?? '') : '');
      },
      'JSXAttribute[name.name=/^(className|class)$/] Literal'(node: Node) {
        const v = valueOf(node);
        if (typeof v === 'string' && ARBITRARY.test(v))
          context.report({
            node,
            message: 'Arbitrary color in "{{v}}". Use the token classes of @seanyeh77/tokens/tailwind.css: bg-surface, text-ink-muted.',
            data: { v: v.slice(0, 40) },
          });
      },
      'JSXAttribute[name.name="style"] Property > TemplateLiteral > TemplateElement'(node: Node) {
        check(node, String((valueOf(node) as { raw: string }).raw));
      },
      // fill="#2457d6" on SVG and similar attributes
      'JSXAttribute[name.name=/^(fill|stroke|color|stopColor|floodColor)$/] Literal'(node: Node) {
        const v = valueOf(node);
        if (typeof v === 'string') check(node, v, 'color');
      },
    };
  },
};

const REPLACE: Record<string, string> = {
  select: 'Select (or MultiSelect)',
  table: 'DataTable',
  dialog: 'Dialog',
  progress: 'ProgressBar',
};
const INPUT_REPLACE: Record<string, string> = {
  checkbox: 'Checkbox',
  radio: 'RadioGroup',
  date: 'DatePicker',
  search: 'SearchField',
  file: 'FileUpload',
  color: 'AccentPicker',
};

const noNativeControls: Rule.RuleModule = {
  meta: { type: 'problem', docs: { description: 'Use the design-system component instead of a native control it replaces.' }, schema: [] },
  create(context) {
    return {
      JSXOpeningElement(node: Node) {
        const el = node as unknown as JSXOpening;
        const name = tagName(el);
        if (REPLACE[name]) context.report({ node, message: 'Native <{{n}}>: use {{c}} from @seanyeh77/ui.', data: { n: name, c: REPLACE[name] } });
        if (name === 'input') {
          const t = literal(attr(el, 'type'));
          if (typeof t === 'string' && INPUT_REPLACE[t])
            context.report({ node, message: '<input type="{{t}}">: use {{c}} from @seanyeh77/ui.', data: { t, c: INPUT_REPLACE[t] } });
        }
      },
    };
  },
};

const noNestedCard: Rule.RuleModule = {
  meta: { type: 'problem', docs: { description: 'No Card inside a Card: one shadow per block.' }, schema: [] },
  create(context) {
    return {
      JSXElement(node: Node) {
        const el = node as unknown as JSXElementNode;
        if (tagName(el.openingElement) !== 'Card') return;
        for (let p = el.parent; p; p = p.parent) {
          if (p.type === 'JSXElement' && tagName(p.openingElement) === 'Card') {
            context.report({
              node,
              message: 'Card inside a Card gives two shadows. Use one Card and split it with headings, or place the Cards side by side.',
            });
            return;
          }
        }
      },
    };
  },
};

const onePrimary: Rule.RuleModule = {
  meta: { type: 'suggestion', docs: { description: 'At most one primary button per section.' }, schema: [] },
  create(context) {
    const SECTIONS = new Set(['Card', 'Dialog', 'Drawer', 'section', 'form', 'SettingsSection']);
    return {
      JSXElement(node: Node) {
        const el = node as unknown as JSXElementNode;
        const name = tagName(el.openingElement);
        if (name !== 'Button' || literal(attr(el.openingElement, 'variant')) !== 'primary') return;
        let section: JSXElementNode | undefined = el.parent;
        while (section && !(section.type === 'JSXElement' && SECTIONS.has(tagName(section.openingElement)))) section = section.parent;
        if (!section) return;
        // Every node under the section: conditionals, fragments, map callbacks and JSX passed in props count too.
        // The two branches of a ternary never render together, so they count as the larger of the two.
        // Returns the primaries that can render at once, in source order.
        const walk = (n: unknown): JSXElementNode[] => {
          if (!n || typeof n !== 'object') return [];
          if (Array.isArray(n)) return n.flatMap(walk);
          const e = n as Omit<JSXElementNode, 'type'> & { type: string } & Record<string, unknown>;
          if (typeof e.type !== 'string') return [];
          if (e.type === 'ConditionalExpression') {
            const a = walk(e.consequent);
            const b = walk(e.alternate);
            return [...walk(e.test), ...(b.length > a.length ? b : a)];
          }
          const own: JSXElementNode[] = [];
          if (e.type === 'JSXElement') {
            if (e !== section && SECTIONS.has(tagName(e.openingElement))) return [];
            if (tagName(e.openingElement) === 'Button' && literal(attr(e.openingElement, 'variant')) === 'primary') own.push(e as JSXElementNode);
          }
          for (const k in e) if (k !== 'parent' && k !== 'loc' && k !== 'range') own.push(...walk(e[k]));
          return own;
        };
        const primaries = walk(section);
        if (primaries.length > 1 && primaries.includes(el) && primaries[0] !== el)
          context.report({ node, message: 'A second primary Button in this section. Keep one primary (the main action) and make the others secondary.' });
      },
    };
  },
};

const VAGUE = /^(確定|確認|好|好的|OK|Ok|ok|Submit|submit|送出|是|否|Yes|No)$/;

const verbLabels: Rule.RuleModule = {
  meta: { type: 'suggestion', docs: { description: 'Button labels say what happens: 儲存, 刪除 api-gateway, 發布. Not 確定 or OK.' }, schema: [] },
  create(context) {
    return {
      JSXElement(node: Node) {
        const el = node as unknown as JSXElementNode;
        if (tagName(el.openingElement) !== 'Button') return;
        const t = textOf(el);
        if (VAGUE.test(t))
          context.report({ node, message: 'Button label "{{t}}" does not say what happens. Use the verb of the action: 儲存, 刪除, 發布.', data: { t } });
      },
    };
  },
};

const dangerConfirm: Rule.RuleModule = {
  meta: { type: 'problem', docs: { description: 'A danger Button is confirmed: pass confirm, or confirmed inside the confirm dialog.' }, schema: [] },
  create(context) {
    return {
      JSXOpeningElement(node: Node) {
        const el = node as unknown as JSXOpening;
        if (tagName(el) !== 'Button' || literal(attr(el, 'variant')) !== 'danger') return;
        if (!attr(el, 'confirm') && !attr(el, 'confirmed'))
          context.report({
            node,
            message: 'Danger Button without confirmation. Add confirm={{ title: "刪除 …？" }}, or confirmed when it is the button inside the confirm Dialog.',
          });
      },
    };
  },
};

const rules = {
  'no-raw-color': noRawColor,
  'no-tailwind-defaults': noTailwindDefaults,
  'no-native-controls': noNativeControls,
  'no-nested-card': noNestedCard,
  'one-primary-button': onePrimary,
  'verb-labels': verbLabels,
  'danger-confirm': dangerConfirm,
};

const plugin: ESLint.Plugin & { configs: Record<string, Linter.Config> } = {
  meta: { name: pkg.name, version: pkg.version },
  rules,
  configs: {},
};

plugin.configs.recommended = {
  name: '@seanyeh77/ui/recommended',
  files: ['**/*.{jsx,tsx}'],
  plugins: { ui: plugin },
  // The TypeScript parser reads .jsx as well, so the config works on its own.
  languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
  rules: {
    'ui/no-raw-color': 'error',
    'ui/no-tailwind-defaults': 'error',
    'ui/no-native-controls': 'error',
    'ui/no-nested-card': 'error',
    'ui/danger-confirm': 'error',
    'ui/one-primary-button': 'warn',
    'ui/verb-labels': 'warn',
  },
};

export default plugin;
export { rules };
