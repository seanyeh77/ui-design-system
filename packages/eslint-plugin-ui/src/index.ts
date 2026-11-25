/* ESLint rules that keep code written against @seanyeh77/ui on the design system's rules.
   Each message says what is wrong and what to use instead.

   // eslint.config.js
   import ui from '@seanyeh77/eslint-plugin-ui';
   export default [ui.configs.recommended];                                                     */
import type { ESLint, Linter, Rule } from 'eslint';
// Bundled into dist/index.js with the TypeScript 6 API it needs (see tsdown.config.ts).
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

type Expr = { type: string; value?: unknown; consequent?: Expr; alternate?: Expr; operator?: string; left?: Expr; right?: Expr; expression?: Expr };
/** Every literal an expression can end up as: through cond ? a : b, a && b, a || b, a ?? b and `as` casts. */
function literalsOf(e: Expr | undefined): unknown[] {
  if (!e) return [];
  if (e.type === 'Literal') return [e.value];
  if (e.type === 'ConditionalExpression') return [...literalsOf(e.consequent), ...literalsOf(e.alternate)];
  if (e.type === 'LogicalExpression') return e.operator === '&&' ? literalsOf(e.right) : [...literalsOf(e.left), ...literalsOf(e.right)];
  if (e.type === 'TSAsExpression' || e.type === 'TSSatisfiesExpression' || e.type === 'TSNonNullExpression') return literalsOf(e.expression);
  return [];
}

/** The literal values an attribute can take: variant="danger", variant={x ? 'danger' : 'quiet'}, variant={x && 'danger'}. */
function attrValues(a: JSXAttr | undefined): unknown[] {
  if (!a) return [];
  if (!a.value) return [true];
  if (a.value.type === 'Literal') return [a.value.value];
  if (a.value.type === 'JSXExpressionContainer') return literalsOf(a.value.expression as Expr | undefined);
  return [];
}
const canBe = (a: JSXAttr | undefined, v: string) => attrValues(a).includes(v);

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
const CLASS_CALL = new RegExp(`^(${CLASS_FNS})$`);
// Whether a string ends up as a class: it reaches className or a class helper as a value, not as a comparison
// (v === 'shadow'), an argument to another function, a lookup key or an object's key.
const isClassValue = (n: Node) => {
  let innerKey: string | undefined;
  for (let c: Node = n, p = n.parent; p; c = p, p = p.parent) {
    const a = p as unknown as { type: string; key?: unknown; computed?: boolean; property?: unknown; callee?: { name?: string }; name?: { name?: string } };
    if (a.type === 'JSXAttribute') return a.name?.name === 'className' || a.name?.name === 'class';
    if (a.type === 'CallExpression') return CLASS_CALL.test(a.callee?.name ?? '');
    if (a.type === 'BinaryExpression' || a.type === 'SwitchCase') return false;
    if (a.type === 'MemberExpression' && a.computed && a.property === c) return false;
    // { 'bg-gray-100': on } in clsx is a class; { shadow: 'lg' } in cva variants is a name.
    if (a.type === 'Property' && a.key === c) return hasClassCallParent(p);
    if (a.type === 'Property') {
      const k = keyName(a.key);
      innerKey ??= k;
      // cva / tv: defaultVariants hold variant names; compoundVariants hold names except under class.
      if (k === 'defaultVariants') return false;
      if ((k === 'compoundVariants' || k === 'compoundSlots') && innerKey !== 'class' && innerKey !== 'className') return false;
    }
  }
  return false;
};
// An object key is a class only in a clsx-style object passed straight to a class helper.
const hasClassCallParent = (prop: Node) => {
  const obj = prop.parent as unknown as { type: string; parent?: unknown } | null;
  if (obj?.type !== 'ObjectExpression') return false;
  // clsx(['p-2', { 'rounded-2xl': on }]) nests the object in arrays.
  let up = obj.parent as { type: string; parent?: unknown; callee?: { name?: string } } | undefined;
  while (up?.type === 'ArrayExpression') up = up.parent as typeof up;
  return up?.type === 'CallExpression' && CLASS_CALL.test(up.callee?.name ?? '');
};
const keyName = (k: unknown) => {
  const key = k as { type?: string; name?: string; value?: unknown } | undefined;
  return key?.type === 'Identifier' ? key.name : typeof key?.value === 'string' ? key.value : undefined;
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

/** Visitors for every string that ends up as a class: className, class and the class helpers (cn, clsx, cva…). */
function classVisitors(check: (node: Node, value: string) => void): Rule.RuleListener {
  const cooked = (node: Node) => (node as unknown as { value: { cooked: string | null } }).value.cooked ?? '';
  return {
    'JSXAttribute[name.name=/^(className|class)$/] Literal'(node: Node) {
      const v = valueOf(node);
      if (typeof v === 'string' && isClassValue(node)) check(node, v);
    },
    'JSXAttribute[name.name=/^(className|class)$/] TemplateElement'(node: Node) {
      if (isClassValue(node)) check(node, cooked(node));
    },
    [`CallExpression[callee.name=/^(${CLASS_FNS})$/] TemplateElement`](node: Node) {
      if (!hasJsxClassAncestor(node) && isClassValue(node)) check(node, cooked(node));
    },
    // Class strings built outside JSX: cn(), clsx(), cva() and friends.
    [`CallExpression[callee.name=/^(${CLASS_FNS})$/] Literal`](node: Node) {
      if (hasJsxClassAncestor(node)) return;
      const v = valueOf(node);
      if (typeof v === 'string' && isClassValue(node)) check(node, v);
    },
  };
}

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
    return classVisitors(check);
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
  textarea: 'TextArea',
  button: 'Button (or IconButton for an icon alone)',
  a: 'Link',
};
const INPUT_REPLACE: Record<string, string> = {
  '': 'TextField',
  text: 'TextField',
  email: 'TextField type="email"',
  password: 'TextField type="password"',
  number: 'TextField type="number"',
  tel: 'TextField type="tel"',
  url: 'TextField type="url"',
  range: 'TextField type="number" or SegmentedControl',
  checkbox: 'Checkbox (or Switch for an on/off setting)',
  radio: 'RadioGroup',
  date: 'DatePicker',
  search: 'SearchField',
  file: 'FileUpload',
  color: 'AccentPicker',
  submit: 'Button',
  button: 'Button',
  reset: 'Button',
};

const noNativeControls: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Use the design-system component instead of a native control it replaces.' },
    schema: [
      {
        type: 'object',
        properties: { allow: { type: 'array', items: { type: 'string' }, description: 'Native tags to allow, e.g. ["a"] when links come from a router.' } },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const allow = new Set(((context.options[0] as { allow?: string[] } | undefined)?.allow ?? []).map((t) => t.toLowerCase()));
    return {
      JSXOpeningElement(node: Node) {
        const el = node as unknown as JSXOpening;
        // Only lower-case names are HTML elements: <Button>, <Link> and <ui.Button> are components.
        if (el.name.type !== 'JSXIdentifier') return;
        const name = tagName(el);
        if (allow.has(name)) return;
        // A native element that wears a design-system class (<button className="ui-link-btn">) is styled by the system.
        const cls = attrValues(attr(el, 'className'));
        if (cls.some((c) => typeof c === 'string' && /(^|\s)ui-[a-z]/.test(c))) return;
        if (REPLACE[name]) context.report({ node, message: 'Native <{{n}}>: use {{c}} from @seanyeh77/ui.', data: { n: name, c: REPLACE[name] } });
        if (name === 'input') {
          const typeAttr = attr(el, 'type');
          // type={kind}: unknown at lint time; hidden inputs carry form data and show nothing.
          const types = typeAttr ? attrValues(typeAttr) : [''];
          for (const t of new Set(types))
            if (typeof t === 'string' && INPUT_REPLACE[t.toLowerCase()] && !allow.has(`input[type=${t || 'text'}]`))
              context.report({
                node,
                message: '<input{{t}}>: use {{c}} from @seanyeh77/ui.',
                data: { t: t ? ` type="${t}"` : '', c: INPUT_REPLACE[t.toLowerCase()] },
              });
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
        if (name !== 'Button' || !canBe(attr(el.openingElement, 'variant'), 'primary')) return;
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
            if (tagName(e.openingElement) === 'Button' && canBe(attr(e.openingElement, 'variant'), 'primary')) own.push(e as JSXElementNode);
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

/** Labels that answer the dialog instead of naming the action. A verb, even a general one (送出, 儲存, 新增), passes; a
    verb with its object (確認刪除, 刪除 api-gateway) passes too. */
const VAGUE = /^(確定|確認|好|好的|OK|Ok|ok|是|否|Yes|yes|No|no)$/;

const verbLabels: Rule.RuleModule = {
  meta: { type: 'suggestion', docs: { description: 'Button labels say what happens: 儲存, 刪除 api-gateway, 發布. Not 確定 or OK.' }, schema: [] },
  create(context) {
    return {
      JSXElement(node: Node) {
        const el = node as unknown as JSXElementNode;
        if (tagName(el.openingElement) !== 'Button') return;
        const t = textOf(el);
        if (VAGUE.test(t))
          context.report({
            node,
            message: 'Button label "{{t}}" does not say what happens. Use the verb of the action instead, e.g. 儲存, 刪除, 送出, 確認刪除.',
            data: { t },
          });
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
        // variant={busy ? 'danger' : 'quiet'} can be danger too.
        if (tagName(el) !== 'Button' || !canBe(attr(el, 'variant'), 'danger')) return;
        if (!attr(el, 'confirm') && !attr(el, 'confirmed'))
          context.report({
            node,
            message: 'Danger Button without confirmation. Add confirm={{ title: "刪除 …？" }}, or confirmed when it is the button inside the confirm Dialog.',
          });
      },
    };
  },
};

// Style properties whose values come from tokens: spacing, type size and family, radius, shadow.
const SIZE_KEY =
  /^(padding|margin|inset|scrollPadding|scrollMargin)(Top|Right|Bottom|Left|Inline|Block|InlineStart|InlineEnd|BlockStart|BlockEnd)?$|^(gap|rowGap|columnGap|fontSize|borderRadius|border(Top|Bottom|Start|End)(Left|Right|Start|End)Radius|boxShadow|fontFamily)$/;
const SIZE_HINT: [RegExp, string][] = [
  [/^font[sS]ize$/, 'var(--text-body) or cssVar("text-small") (text-mini, text-small, text-body, text-title, text-h4…), or Tailwind text-small'],
  [/[rR]adius$/, 'var(--radius-md) or cssVar("radius-sm") (radius-xs, -sm, -md, -lg, -full), or Tailwind rounded-md'],
  [/^boxShadow$/, 'var(--shadow-card) or cssVar("shadow-overlay"), or Tailwind shadow-card'],
  [/^fontFamily$/, 'var(--font-sans) or var(--font-mono), or Tailwind font-sans / font-mono'],
  [/./, 'var(--space-4) or cssVar("space-4") (space-1 4 px to space-12 48 px), or Tailwind p-4 / gap-2'],
];
const hintFor = (key: string) => (SIZE_HINT.find(([re]) => re.test(key)) ?? SIZE_HINT[SIZE_HINT.length - 1])[1];
// A length written out: 12px, 0.75rem, 1.5em. Inside var(…) it is a fallback and not counted.
const LENGTH = /(^|[^\w-])\d*\.?\d+(px|rem|em)\b/;
const KEYWORD = /^(0|auto|none|inherit|initial|unset|revert|normal|currentColor|transparent)$/i;
const stripVars = (v: string) => {
  // var(--x, 12px) keeps its fallback out of the check; nested parentheses are rare enough to handle one level.
  let out = v;
  for (let i = 0; i < 3; i++) out = out.replace(/var\([^()]*(\([^()]*\)[^()]*)*\)/g, '');
  return out;
};
const rawSizeIn = (key: string, value: unknown): boolean => {
  if (typeof value === 'number') return value !== 0;
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v || KEYWORD.test(v)) return false;
  const rest = stripVars(v).trim();
  if (key === 'fontFamily' || key === 'boxShadow') return rest !== '' && !KEYWORD.test(rest);
  return LENGTH.test(rest);
};
// Tailwind arbitrary values for the same properties: p-[7px], text-[13px], rounded-[10px], shadow-[0_1px_2px…],
// font-['Inter']. Colors in brackets are no-raw-color's; var(--…) and (--…) in brackets are tokens.
const TW_ARBITRARY = /^-?(p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy]|text|rounded(?:-[trblse]{1,2})?|shadow|font|leading|tracking)-\[([^\]]+)\]$/;
const twArbitrary = (c: string) => {
  const m = TW_ARBITRARY.exec(c);
  if (!m) return false;
  const inner = m[2];
  if (/^(var\(|--|#|rgba?\(|hsla?\(|oklch\(|color:)/.test(inner)) return false;
  // text-[length:var(--x)] and similar typed hints with a variable are tokens too.
  if (/var\(--/.test(inner) && !LENGTH.test(stripVars(inner))) return false;
  return m[1] === 'font' || m[1] === 'shadow' || LENGTH.test(inner.replace(/_/g, ' ')) || /^\d*\.?\d+$/.test(inner);
};

const noRawSize: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Spacing, type sizes, font families, radii and shadows come from tokens, not raw px values.' },
    schema: [],
  },
  create(context) {
    const report = (node: Node, key: string, v: string) =>
      context.report({ node, message: '{{k}}: {{v}} is a raw value. Use a token: {{hint}}.', data: { k: key, v: v.slice(0, 40), hint: hintFor(key) } });
    return {
      // Any literal under style, also inside ternaries and ?? / && ; the key is the nearest property's.
      'JSXAttribute[name.name="style"] Literal'(node: Node) {
        let p: Node | null = node.parent;
        for (let c: Node = node; p && p.type !== 'Property'; c = p, p = p.parent) {
          const m = p as unknown as { type: string; test?: unknown; computed?: boolean; property?: unknown };
          // Only values pass up: not the test of a ternary, a lookup key or a call's argument.
          const passes =
            (m.type === 'ConditionalExpression' && m.test !== c) ||
            ['LogicalExpression', 'TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression', 'UnaryExpression'].includes(m.type);
          if (!passes) return;
        }
        if (!p) return;
        const prop = p as unknown as { key?: Node & { name?: string; value?: unknown }; computed?: boolean };
        if (prop.key === node || prop.computed) return;
        const key = String(prop.key?.name ?? prop.key?.value ?? '');
        if (!SIZE_KEY.test(key)) return;
        const v = valueOf(node);
        if (rawSizeIn(key, v)) report(node, key, String(v));
      },
      'JSXAttribute[name.name="style"] Property > TemplateLiteral'(node: Node) {
        const prop = node.parent as unknown as { key?: { name?: string; value?: unknown } };
        const key = String(prop.key?.name ?? prop.key?.value ?? '');
        if (!SIZE_KEY.test(key)) return;
        const quasis = (node as unknown as { quasis: { value: { cooked: string | null } }[] }).quasis.map((q) => q.value.cooked ?? '').join(' ');
        if (key === 'fontFamily' || key === 'boxShadow' ? rawSizeIn(key, quasis.replace(/\s+/g, ' ')) : LENGTH.test(stripVars(quasis)))
          report(node, key, quasis.trim());
      },
      ...classVisitors((node, value) => {
        for (const c of twClasses(value))
          if (twArbitrary(c))
            context.report({
              node,
              message: '{{c}} is an arbitrary value. Use a token class: p-4, gap-2, text-small, rounded-md, shadow-card, font-mono (or [var(--…)]).',
              data: { c },
            });
      }),
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
  'no-raw-size': noRawSize,
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
    'ui/no-raw-size': 'warn',
    'ui/one-primary-button': 'warn',
    'ui/verb-labels': 'warn',
  },
};

export default plugin;
export { rules };
