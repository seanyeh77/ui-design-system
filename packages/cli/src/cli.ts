#!/usr/bin/env node
/* ui: the command-line tools of @seanyeh77/ui.
     ui check <file or URL>...   the automatic part of "Before you finish": layout, touch targets, text, axe-core
     ui shots <file or URL>...   deterministic screenshots: write baselines (--out) or compare with them (--compare)
     ui docs [Name] [--full]     a component's 用法 block (--full: the whole README), a guide, or the list of docs
     ui list                     every guide and component with its one-line description
     ui add <template> [dir]     writes a page template (dashboard, list-detail, settings, login) into the project */
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs, type ParseArgsConfig } from 'node:util';
import type { Locator, Page } from 'playwright';
import { measure, type Findings } from './measure';
import { GROUPS, GUIDES, stripComments, summary, usageBlock } from './usage';
import { DEFAULT_TOLERANCE, type Tolerance } from './compare';
import { addReport, defaultDir, loadTemplates, writeTemplate } from './add';
import {
  applyTheme,
  changedShots,
  growToScrollContainer,
  compareWithBaselines,
  isFileFontCors,
  jobsFor,
  optimizePngs,
  orphanBaselines,
  shootPage,
  shotLaunchOptions,
  shotName,
  cleanName,
  waitForAnimations,
  summaryMarkdown,
  writeShots,
  FIXED_TIME,
  type ShotResult,
} from './shots';

const HELP_CHECK = `ui check <file or URL>... [--shots DIR] [--strict] [--wait MS] [--open SELECTOR]... [--no-interact] [--no-axe]
  Opens each page at 390 px and 1280 px, light and dark, and fails (exit 1) on:
  console errors, horizontal overflow at 390 px, touch targets under 48 px at 390 px and targets under 24 px that
  crowd another target at 1280 px (WCAG 2.5.8), touch areas that spill past their control, a card inside a card, raw
  Markdown, native controls the design system replaces, wrapped buttons, tabs, table headers or interface headings
  (headings in Markdown content may wrap), interface text cut off with no tooltip or title, text outside its card,
  controls of different heights in one toolbar row or one form row (a FormGrid row, fields side by side), paragraphs
  of two or more lines centered at 390 px (EmptyState and ErrorPage excepted), a document that scrolls around
  AppShell, a status badge with a shadow in a table or card, page CSS outside a cascade layer on element selectors (a
  reset, normalize or starter CSS: button, *, h1) that overrides a component, and the axe-core rules of WCAG 2.0, 2.1
  and 2.2 A and AA.
  Each measurement waits until the page's animations and transitions end (up to 1.5 s), so a fade is not measured
  half way.
  A page without <meta name="viewport"> gets one report at 390 px (缺 viewport meta) and no touch-target check there.
  It also opens what the page hides behind clicks, at both widths in both themes: each tab of a [role=tablist], each
  SettingsLayout category, and each menu or popover of an [aria-haspopup] button in a toolbar or top bar (up to 12
  states a page), and checks every state for the problems the page did not already have. The line of each width and
  theme counts the problems of the page and of its opened states; each state's problems follow under its name.
  --open SELECTOR  clicks the first match and checks the state it opens (a dialog, a drawer); repeat for more.
  --no-interact    skips the automatic tabs, categories and toolbar menus (--open still runs).
  --no-axe         skips the axe-core pass.
  --shots DIR      saves a full-page screenshot of each width and theme in DIR (<name>-<width>-<theme>.png, <name> as
                   in ui shots), and one of each opened state (<name>-<width>-<theme>-<state>.png; an open dialog, drawer or menu at the viewport size).
  --strict         also fails on inline text links under 48 px.
  --wait MS        waits this long after load before measuring (default 800).
  Exits 2 when a page cannot be checked at all: it does not load, or the check itself crashes.`;

const HELP_SHOTS = `ui shots <file or URL>... (--out DIR [--prune] | --compare DIR --diff DIR) [--settle MS] [--threshold N] [--max-diff PERCENT]
  Deterministic screenshots at 390 px and 1280 px, light and dark (DIR/<name>-<width>-<theme>.png): fixed clock
  (${FIXED_TIME}, fake timers), reduced motion, animations stopped, caret hidden, fonts loaded, scale 1, full page,
  including what scrolls inside the page's own scroll container (AppShell's main area), measured once the network is
  idle and the fonts are loaded, and again until the height stays the same. <name> is a file's name or a URL's path,
  then its query and hash (http://host/settings#billing → settings-billing, iframe.html?id=button--primary →
  iframe-id-button-primary).
  --out DIR        writes the shots (baselines); a file with the same pixels is left as it is. New files are
                   optimised losslessly with oxipng when it is on PATH. --prune also deletes the PNGs in DIR
                   that no page of this run produced (a removed or renamed page).
  --compare DIR    compares with the baselines in DIR and exits 1 when a shot changed or has no baseline. A pixel
                   differs when its color distance is over --threshold (default ${DEFAULT_TOLERANCE.threshold}, 0 to 1); a shot changed when
                   over --max-diff percent of its pixels differ (default ${DEFAULT_TOLERANCE.maxDiffPercent} %) or its size changed.
  --diff DIR       with --compare: <name>-actual.png, -expected.png and -diff.png (differences in red) for each changed
                   shot, and summary.md.
  --settle MS      fake time the page runs before the shot (default 1000).
  A changed shot is taken once more; it passes when the second shot matches.
  Exits 2 when a page cannot be opened. Uses CHROMIUM_PATH, else Playwright's full Chromium (channel chromium).`;

const HELP_DOCS = `ui docs [Name] [--full]
  Prints the 用法 block of a component (Button, DataTable…): what it is, a minimal example and the rules most often
  gotten wrong. --full prints the whole README. Guides print whole: guidelines (the core rules every page needs),
  layout, forms, data, monitoring, code, theme, motion. ui docs icons prints every built-in icon name on one line;
  ui docs agents prints the package's AGENTS.md. Without a name, prints the reading order and lists every doc.`;

const HELP_ADD = `ui add <template> [dir] [--force]
  Writes a page template into the project, from the copy inside this package (no network): dashboard, list-detail,
  settings, login. dir defaults to src/components/blocks/<template> (components/blocks/<template> without a src
  folder). Existing files are kept unless --force. The same templates as the shadcn registry on the docs site.`;

const HELP = `${HELP_CHECK}
${HELP_ADD}
${HELP_DOCS}
${HELP_SHOTS}
ui list          lists every guide (in reading order) and every component by group, with its one-line description`;

function docsDir(): string {
  const require = createRequire(import.meta.url);
  return join(dirname(require.resolve('@seanyeh77/ui/package.json')), 'docs');
}

/** Each component's group, from docs/components.json (written at build time); empty for an older package. */
function componentIndex(dir: string): { name: string; group: string }[] {
  try {
    return JSON.parse(readFileSync(join(dir, 'components.json'), 'utf8')) as { name: string; group: string }[];
  } catch {
    return [];
  }
}

/** A guide is any doc that is not a component's README (guidelines, the topic files, icons, agents). */
function isGuide(dir: string): (file: string) => boolean {
  const names = new Set(componentIndex(dir).map((c) => c.name));
  return (f) => (names.size ? !names.has(f.slice(0, -3)) : /^[a-z]/.test(f));
}

/** Guides first, then the components. */
function docFiles(dir: string): string[] {
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  const guideFile = isGuide(dir);
  const guide = (f: string) => (guideFile(f) ? 0 : 1);
  return files.sort((a, b) => guide(a) - guide(b) || (a === 'guidelines.md' ? -1 : b === 'guidelines.md' ? 1 : a.localeCompare(b)));
}

function readingOrder(): string[] {
  return [
    'Reading order: guidelines first, then a topic guide only when the page has that topic, then the 用法 block of each component you use.',
    ...GUIDES.map(([g, what], i) => `  ${String(i + 1).padStart(2)}. ${g.padEnd(12)} ${what}`),
    '',
  ];
}

function docs(name: string | undefined, full: boolean) {
  const dir = docsDir();
  const files = docFiles(dir);
  if (!name) return console.log([...readingOrder(), 'Every doc:', ...files.map((f) => '  ' + f.slice(0, -3))].join('\n'));
  const hit = files.find((f) => f.slice(0, -3).toLowerCase() === name.toLowerCase());
  if (!hit) {
    console.error(`No docs for "${name}". Run "ui docs" for the list.`);
    process.exit(1);
  }
  // HTML comments are metadata for the docs site (the @dsCard line), not for the reader.
  const md = stripComments(readFileSync(join(dir, hit), 'utf8'));
  const usage = full ? null : usageBlock(md);
  if (!usage) return console.log(md);
  // The note only when the README has more than its 用法 block.
  const more = md.trim().length > usage.trim().length;
  console.log(more ? usage + `\n(用法 only. The whole README: ui docs ${hit.slice(0, -3)} --full)` : usage);
}

function list() {
  const dir = docsDir();
  const files = docFiles(dir);
  const lines = ['Guides, in reading order:'];
  const guideFile = isGuide(dir);
  const guides = files.filter(guideFile).map((f) => f.slice(0, -3));
  const ordered = [...GUIDES.map(([g]) => g).filter((g) => guides.includes(g)), ...guides.filter((g) => !GUIDES.some(([n]) => n === g))];
  for (const g of ordered) {
    // A guide is described by its title.
    const md = readFileSync(join(dir, `${g}.md`), 'utf8');
    lines.push(`  ${g.padEnd(18)} ${/^# (.+)$/m.exec(md)?.[1] ?? ''}`);
  }
  // Components by group, like llms.txt: the groups come from docs/components.json (an older package: one group).
  const groupOf = new Map(componentIndex(dir).map((c) => [c.name, c.group]));
  const components = files.filter((f) => !guideFile(f)).map((f) => f.slice(0, -3));
  const order = [...Object.keys(GROUPS), 'Other'];
  const byGroup = new Map<string, string[]>();
  for (const c of components) {
    const g = groupOf.get(c) ?? 'Other';
    byGroup.set(g, [...(byGroup.get(g) ?? []), c]);
  }
  const groups = [...byGroup.keys()].sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
  for (const g of groups) {
    lines.push('', `${GROUPS[g] ?? (g === 'Other' ? '其他' : g)} (${g}):`);
    for (const c of byGroup.get(g) ?? []) lines.push(`  ${c.padEnd(18)} ${summary(readFileSync(join(dir, `${c}.md`), 'utf8'))}`);
  }
  console.log(lines.join('\n'));
}

const toUrl = (t: string) => (t.includes('://') ? new URL(t).href : pathToFileURL(resolve(t)).href);

/** The page itself could not be opened: a wrong path, no server, or an HTTP error. */
class Unreachable extends Error {}

async function shots(targets: string[], opts: { out?: string; compare?: string; diff?: string; prune: boolean; settle: number; tolerance: Tolerance }) {
  // The argument checks below make sure of these: --out, or --compare with --diff.
  const out = opts.out ?? '';
  const diff = opts.diff ?? '';
  const { chromium } = await import('playwright');
  const browser = await chromium.launch(shotLaunchOptions()).catch((e: unknown) => {
    console.error(String(e).split('\n')[0]);
    console.error('No Chromium for ui shots. Run `npx playwright install chromium`, or set CHROMIUM_PATH to an installed Chrome or Chromium.');
    process.exit(2);
  });
  const jobs = jobsFor(targets, toUrl);
  // 4 lanes; results print in the order the targets were given.
  const lanes: Promise<unknown>[] = Array(4).fill(Promise.resolve());
  const runs = jobs.map((job, i) => {
    const shoot = async () => {
      const shots = await shootPage(browser, job, opts.settle);
      if (!opts.compare) return { shots, retried: [] as string[] };
      // A changed shot is taken once more, and the page passes if the second shot matches: a rare race in a page
      // (a measurement that lands one frame late) then does not fail CI, while a real change fails both times.
      const changed = changedShots(shots, opts.compare, opts.tolerance);
      if (!changed.length) return { shots, retried: [] };
      const again = await shootPage(browser, job, opts.settle);
      for (const n of changed) {
        const next = again.get(n);
        if (next) shots.set(n, next);
      }
      return { shots, retried: changed };
    };
    const r = lanes[i % 4].then(() =>
      shoot().then(
        ({ shots, retried }) => ({ job, shots, retried, error: undefined }),
        (e: unknown) => ({ job, shots: undefined, retried: [], error: String(e).split('\n')[0] }),
      ),
    );
    lanes[i % 4] = r;
    return r;
  });
  const all: ShotResult[] = [];
  const names = new Set<string>();
  let unshot = false;
  for (const r of runs) {
    const { job, shots, retried, error } = await r;
    if (!shots) {
      unshot = true;
      console.log(`${job.url}\n  could not shoot: ${error}`);
      continue;
    }
    for (const n of shots.keys()) names.add(n);
    const results = opts.compare ? compareWithBaselines(shots, opts.compare, diff, opts.tolerance) : writeShots(shots, out);
    all.push(...results);
    const bad = results.filter((x) => x.status === 'changed' || x.status === 'new');
    const head = opts.compare ? (bad.length ? '' : 'same') : results.some((x) => x.status === 'written') ? 'written' : 'unchanged';
    console.log(`${job.url}: ${head}`);
    for (const x of opts.compare ? bad : results) console.log(`  ${x.name}: ${x.status}${x.detail ? ` (${x.detail})` : ''}`);
    for (const n of retried) if (!bad.some((x) => x.name === n)) console.log(`  ${n}: same on the second shot (the first differed)`);
  }
  await browser.close();
  if (opts.compare) {
    const orphans = orphanBaselines(opts.compare, names);
    const changed = all.filter((x) => x.status === 'changed' || x.status === 'new').length;
    // A partial run (a few pages) leaves most baselines unused: name them only when they are few.
    if (orphans.length)
      console.log(
        orphans.length <= 12
          ? `baselines with no page in this run (a removed or renamed page?): ${orphans.join(', ')}`
          : `${orphans.length} baselines have no page in this run (expected when only some pages are passed).`,
      );
    if (changed || orphans.length || unshot) {
      mkdirSync(diff, { recursive: true });
      writeFileSync(join(diff, 'summary.md'), summaryMarkdown(all, orphans, opts.compare));
    }
    console.log(
      changed
        ? `${changed} of ${all.length} screenshots changed or have no baseline. Diffs and new shots: ${opts.diff}`
        : `${all.length} screenshots match ${opts.compare}.`,
    );
    process.exit(unshot ? 2 : changed ? 1 : 0);
  }
  const written = all.filter((x) => x.status === 'written').length;
  const optimized = optimizePngs([]);
  if (opts.prune && !unshot)
    for (const f of orphanBaselines(out, names)) {
      unlinkSync(join(out, f));
      console.log(`removed ${f} (no page produced it)`);
    }
  console.log(
    `${all.length} screenshots in ${opts.out}: ${written} written${optimized ? ' (oxipng)' : ' (oxipng not found: PNGs as Playwright wrote them)'}, ${all.length - written} kept (same pixels).`,
  );
  process.exit(unshot ? 2 : 0);
}

interface CheckOptions {
  shots?: string;
  strict: boolean;
  wait: number;
  /** Selectors to click, one state each (--open). */
  open: string[];
  /** Go through tabs, SettingsLayout categories and toolbar menus by themselves. */
  interact: boolean;
  axe: boolean;
}

/** The WCAG levels the axe-core pass checks: 2.0, 2.1 and 2.2, A and AA. */
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
let axeSource: string | undefined;
const axeScript = () => (axeSource ??= readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8'));

/**
 * Runs axe-core in the page and returns one line per rule it reports. contrastOnly: only color-contrast (the dark
 * pass: every other rule gives the same result as in light). preload off: axe would fetch the stylesheets again,
 * which fails on file:// pages and shows up as console errors.
 */
async function axeRun(page: Page, contrastOnly = false, skip: string[] = []): Promise<string[]> {
  if (!(await page.evaluate(() => 'axe' in window))) await page.addScriptTag({ content: axeScript() });
  const found = await page.evaluate(
    async ({ tags, contrastOnly, skip }) => {
      type Violation = { id: string; impact?: string | null; help: string; nodes: { target: unknown[] }[] };
      const axe = (window as unknown as { axe: { run: (ctx: Document, o: object) => Promise<{ violations: Violation[] }> } }).axe;
      const runOnly = contrastOnly ? { type: 'rule', values: ['color-contrast'] } : { type: 'tag', values: tags };
      // target-size is ui check's own 24 px check, with the inline exemptions above.
      const rules = Object.fromEntries(['target-size', ...skip].map((id) => [id, { enabled: false }]));
      // The page may run axe itself (Storybook's accessibility addon): axe runs one at a time, so wait for that run.
      const run = async (tries: number): Promise<{ violations: Violation[] }> => {
        try {
          return await axe.run(document, { runOnly, resultTypes: ['violations'], preload: false, rules });
        } catch (e) {
          if (tries <= 0 || !String(e).includes('already running')) throw e;
          await new Promise((ok) => setTimeout(ok, 200));
          return run(tries - 1);
        }
      };
      const r = await run(50);
      return r.violations.map((v) => ({
        id: v.id,
        impact: v.impact ?? '',
        help: v.help,
        count: v.nodes.length,
        target: String(v.nodes[0]?.target?.[0] ?? ''),
      }));
    },
    { tags: AXE_TAGS, contrastOnly, skip },
  );
  return found.map((v) => `${v.id} (${v.impact}): ${v.help}; ${v.count} element${v.count === 1 ? '' : 's'}, e.g. ${v.target}`);
}

/** The problems in one measurement. noViewport: the 390 px pass of a page without a viewport meta (no touch checks). */
function problemsOf(res: Findings, phone: boolean, strict: boolean): string[] {
  const problems: string[] = [];
  const list = (items: string[], n = 12) => `${items.slice(0, n).join('; ')}${items.length > n ? ` (+${items.length - n} more)` : ''}`;
  if (res.nested.length) problems.push('card inside a card (two shadows): ' + res.nested.join('; '));
  if (res.markdown.length) problems.push('raw Markdown shown: ' + res.markdown.join('; '));
  if (res.native.length) problems.push('native controls: ' + [...new Set(res.native)].join('; '));
  if (res.wrapped.length) problems.push('text that must stay on one line wraps: ' + res.wrapped.join('; '));
  if (res.truncated.length)
    problems.push('interface text cut off: ' + list(res.truncated, 8) + '. Give it room, or put the full text in a Tooltip or a title.');
  if (res.outside.length) problems.push('text outside its card: ' + res.outside.join('; ') + '. Leave room inside the card (chart axis labels, long words).');
  if (res.mixed.length)
    problems.push(
      'controls of different heights in one toolbar row: ' +
        res.mixed.join('; ') +
        '. Use the system controls (Button, IconButton, SearchField, Select: 40 px) without your own height or padding.',
    );
  if (res.formMixed.length)
    problems.push(
      'fields of different heights in one form row: ' +
        res.formMixed.join('; ') +
        '. Use the system fields (TextField, Select, MultiSelect, DatePicker: 40 px) without your own height or padding.',
    );
  if (res.docScroll)
    problems.push(
      `the document scrolls around AppShell (${res.docScroll}): AppShell scrolls its own main area. Remove page margin or padding around the frame and keep content inside it.`,
    );
  if (res.raised.length)
    problems.push(
      'status badge with a shadow in a table or card: ' +
        res.raised.join('; ') +
        '. Inside a table or card a Badge is a dot and text: remove your own box-shadow or chip styles.',
    );
  if (res.unlayered.length)
    problems.push(
      'page CSS outside a layer overrides components: ' +
        res.unlayered.join('; ') +
        ". Put page resets and normalize CSS in @layer base (or another layer declared before ui), and delete starter CSS such as Vite's index.css.",
    );
  if (phone && res.viewportMeta) {
    if (res.overflow.length) problems.push('horizontal overflow: ' + res.overflow.join('; '));
    if (res.escaped.length) problems.push('touch area larger than its control (covers other controls): ' + res.escaped.join('; '));
    if (res.small.length) problems.push(`touch targets under 48 px: ${list(res.small)}`);
    if (res.centered.length)
      problems.push('long text centered on a phone: ' + res.centered.join('; ') + '. Align paragraphs of two or more lines to the start (text-align: start).');
    if (res.inline.length && strict) problems.push('inline targets under 48 px: ' + list(res.inline));
  }
  if (!phone && res.small24.length) problems.push(`targets under 24 px next to another target (WCAG 2.5.8): ${list(res.small24, 8)}`);
  return problems;
}

const NO_VIEWPORT =
  '缺 viewport meta: add <meta name="viewport" content="width=device-width, initial-scale=1">. Without it a phone lays the page out 980 px wide and shrinks it, so overflow and touch targets at 390 px were not checked.';

/** Buttons that open a menu or popover in a toolbar or the top bar; their open state is checked by itself. */
const TOOLBAR_POPUPS = ['.ui-dt-tools', '.ui-dt-actions', '.ui-card-actions', '[role=toolbar]', '.ui-topbar', '.ui-actionbar']
  .map((t) => `${t} [aria-haspopup]:not([aria-haspopup="false"])`)
  .join(', ');
const MAX_STATES = 12;

/** Marks the elements to click for the automatic states (data-ui-check-state) and names them. Runs inside the page. */
function findStates({ popups, max }: { popups: string; max: number }) {
  const out: { id: string; label: string; kind: 'popup' | 'view' }[] = [];
  const shown = (el: Element) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !el.closest('[inert], [aria-hidden="true"]');
  };
  const name = (el: Element) => {
    const by = el.getAttribute('aria-labelledby');
    const labelled = by
      ? by
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent ?? '')
          .join(' ')
      : '';
    const label = (el as HTMLInputElement).labels?.[0]?.textContent ?? '';
    return (el.getAttribute('aria-label') || labelled || label || el.textContent || el.getAttribute('placeholder') || el.tagName.toLowerCase())
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 24);
  };
  const add = (el: Element, label: string, kind: 'popup' | 'view') => {
    if (out.length >= max || !shown(el) || el.matches(':disabled, [aria-disabled="true"]')) return;
    const id = String(out.length);
    el.setAttribute('data-ui-check-state', id);
    out.push({ id, label, kind });
  };
  for (const el of document.querySelectorAll(popups)) add(el, `the menu of "${name(el)}"`, 'popup');
  for (const list of [...document.querySelectorAll('[role=tablist]')].slice(0, 3))
    for (const tab of list.querySelectorAll('[role=tab]')) if (tab.getAttribute('aria-selected') !== 'true') add(tab, `tab "${name(tab)}"`, 'view');
  for (const cat of document.querySelectorAll('.ui-settings-cat')) if (cat.getAttribute('aria-current') !== 'page') add(cat, `category "${name(cat)}"`, 'view');
  return out;
}

async function check(targets: string[], opts: CheckOptions) {
  const { chromium } = await import('playwright');
  // The same browser as ui shots: CHROMIUM_PATH, else Playwright's full Chromium.
  const browser = await chromium.launch(shotLaunchOptions()).catch((e: unknown) => {
    console.error(String(e).split('\n')[0]);
    console.error('No Chromium for ui check. Run `npx playwright install chromium`, or set CHROMIUM_PATH to an installed Chrome or Chromium.');
    process.exit(2);
  });
  // Chromium normalizes URLs (trailing slash, case, escapes); compare against the same form.
  const jobs = jobsFor(targets, toUrl);

  // One page: 2 widths x 2 themes, each in a fresh context (initTheme reads the color scheme at load).
  const checkOne = async ({ url, stem }: { url: string; stem: string }) => {
    const out: string[] = [url];
    let bad = false;
    let viewportReported = false;
    let fontCors = false;
    for (const width of [390, 1280]) {
      for (const theme of ['light', 'dark'] as const) {
        const phone = width === 390;
        const viewport = { width, height: phone ? 844 : 900 };
        const ctx = await browser.newContext({ viewport, colorScheme: theme, hasTouch: phone, isMobile: phone, deviceScaleFactor: phone ? 2 : 1 });
        try {
          const page = await ctx.newPage();
          const errors: string[] = [];
          page.on('pageerror', (e) => errors.push(String(e)));
          page.on('console', (m) => {
            if (m.type() !== 'error') return;
            const src = m.location().url;
            // Chromium asks every server for /favicon.ico; a missing one is not the page's error.
            if (/\/favicon\.ico$/.test(src)) return;
            // A font blocked by CORS on a file:// page: a note once per page, not a console error.
            if (isFileFontCors(url, m.text(), src)) return void (fontCors = true);
            errors.push(src && src !== url ? `${m.text()} (${src})` : m.text());
          });
          const resp = await page.goto(url, { waitUntil: 'load' }).catch((e: unknown) => {
            throw new Unreachable(String(e).split('\n')[0]);
          });
          if (resp && !resp.ok()) throw new Unreachable(`HTTP ${resp.status()}`);
          // A redirect after load (an auth guard, a meta refresh) replaces the document: wait and measure the page it lands on.
          const run = async <T>(evaluate: () => Promise<T>): Promise<T> => {
            for (let tries = 0; ; tries++) {
              try {
                return await evaluate();
              } catch (e) {
                if (tries >= 2 || !String(e).includes('Execution context was destroyed')) throw e;
                await page.waitForLoadState('load');
              }
            }
          };
          await run(() => page.evaluate(applyTheme, theme));
          await page.waitForTimeout(opts.wait);
          await page.waitForLoadState('load');
          // Measure the page at rest: rows fading out, a drawer sliding in or a fade on a tab switch are mid-way
          // otherwise, and their boxes are reported as problems they do not have once the animation ends.
          await run(() => waitForAnimations(page));
          const res = await run(() => page.evaluate(measure));
          if (page.url() !== url && width === 390 && theme === 'light') out.push(`  (redirected to ${page.url()})`);
          const problems: string[] = [];
          if (errors.length) problems.push('console errors: ' + errors.slice(0, 5).join(' | '));
          if (phone && !res.viewportMeta && !viewportReported) {
            problems.push(NO_VIEWPORT);
            viewportReported = true;
          }
          problems.push(...problemsOf(res, phone, opts.strict));
          const axe = opts.axe
            ? await run(() => axeRun(page, theme === 'dark')).catch((e: unknown) => [`axe-core could not run: ${String(e).split('\n')[0]}`])
            : [];
          if (axe.length) problems.push('accessibility (axe-core): ' + axe.join(' | '));
          const shoot = async (suffix: string, overlay = false) => {
            if (!opts.shots) return;
            const path = join(opts.shots, `${shotName(stem, width, theme).slice(0, -4)}${suffix}.png`);
            // An open dialog, drawer or menu covers the viewport: a shot of the viewport, not of the page behind it.
            if (overlay) return void (await page.screenshot({ path }));
            // The full page, with what scrolls inside the page's own scroll container (AppShell's main area).
            await growToScrollContainer(page, viewport, () => page.waitForTimeout(150));
            await page.screenshot({ path, fullPage: true });
            await page.setViewportSize(viewport);
          };
          await shoot('');
          // The states behind clicks, in both themes like the page itself, so a problem behind a tab is reported in
          // light and dark alike: --open selectors, then the toolbar menus, tabs and categories. Each reports only what
          // the page did not already have.
          const states: { label: string; problems: string[] }[] = [];
          if (opts.open.length || opts.interact) {
            // What the page already had, item by item: a target by its name (not its neighbor), an axe rule by its id.
            const itemKey = (item: string) => item.split(', next to ')[0].replace(/ \d+ x \d+ px$/, '');
            const axeKey = (line: string) => line.split(' ')[0];
            const knownAxe = new Set(axe.map(axeKey));
            const newOnly = (now: Findings): Findings => {
              const out = { ...now };
              for (const k of Object.keys(now) as (keyof Findings)[]) {
                const was = res[k];
                const is = now[k];
                if (Array.isArray(was) && Array.isArray(is)) {
                  const seen = new Set(was.map(itemKey));
                  (out[k] as string[]) = is.filter((x) => !seen.has(itemKey(x)));
                } else if (typeof was === 'string' && was) (out[k] as string) = '';
              }
              return out;
            };
            // trigger: a menu or dialog opener, closed again afterwards (Escape, else a second click). Returns the
            // problems of the opened state; null when the target could not be clicked.
            const checkState = async (label: string, target: Locator, trigger: boolean): Promise<string[] | null> => {
              const before = errors.length;
              try {
                await target.click({ timeout: 3000 });
              } catch {
                return null;
              }
              await page.waitForTimeout(150);
              await run(() => waitForAnimations(page));
              const after = await run(() => page.evaluate(measure));
              const found = problemsOf(newOnly(after), phone, opts.strict);
              if (errors.length > before) found.unshift('console errors: ' + errors.slice(before, before + 5).join(' | '));
              if (opts.axe) {
                // A modal menu or dialog hides the rest of the page from screen readers (aria-hidden) while focus stays
                // trapped inside it: axe's aria-hidden-focus on that hidden rest is not a problem of the open state.
                const skip = trigger ? ['aria-hidden-focus'] : [];
                const more = (await run(() => axeRun(page, theme === 'dark', skip)).catch(() => [] as string[])).filter((v) => !knownAxe.has(axeKey(v)));
                if (more.length) found.push('accessibility (axe-core): ' + more.join(' | '));
              }
              // A shot of the opened state, named after it: Button-390-light-the-menu-of-更多.png. An overlay (trigger) is
              // shot at the viewport's size.
              await shoot(`-${cleanName(label)}`, trigger);
              if (trigger) {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(150);
                if ((await target.getAttribute('aria-expanded').catch(() => null)) === 'true') {
                  await target.click({ timeout: 3000 }).catch(() => undefined);
                  await page.waitForTimeout(150);
                }
                await run(() => waitForAnimations(page));
              }
              return found;
            };
            for (const sel of opts.open) {
              const target = page.locator(sel).first();
              const label = `--open ${sel}`;
              if (!(await target.count())) {
                states.push({ label, problems: ['nothing on the page matches'] });
                continue;
              }
              const found = await checkState(label, target, true);
              if (!found) states.push({ label, problems: ['could not click it'] });
              else if (found.length) states.push({ label, problems: found });
            }
            if (opts.interact) {
              const auto = await run(() => page.evaluate(findStates, { popups: TOOLBAR_POPUPS, max: MAX_STATES }));
              for (const st of auto) {
                const found = await checkState(st.label, page.locator(`[data-ui-check-state="${st.id}"]`), st.kind === 'popup');
                // A click that fails (an element moved away by an earlier state) is not the page's problem.
                if (found?.length) states.push({ label: st.label, problems: found });
              }
            }
          }
          // The header covers the page and every opened state of this width and theme.
          const count = problems.length + states.reduce((n, st) => n + st.problems.length, 0);
          out.push(`  ${width} px ${theme}: ${count ? `${count} problem${count === 1 ? '' : 's'}` : 'ok'}`);
          for (const p of problems) out.push('    - ' + p);
          for (const st of states) {
            out.push(`    after opening ${st.label}:`);
            for (const p of st.problems) out.push('      - ' + p);
          }
          if (phone && theme === 'light' && res.viewportMeta && res.inline.length && !opts.strict)
            out.push(`    (inline text targets and links whose row is the target, exempt: ${res.inline.length})`);
          bad ||= count > 0;
        } finally {
          await ctx.close();
        }
      }
    }
    if (fontCors) out.push('  note: fonts were blocked by CORS because the page is a file:// URL; serve the page over http to load fonts');
    return { out, bad };
  };

  if (opts.shots) mkdirSync(opts.shots, { recursive: true });
  // 4 lanes; reports print in the order the targets were given. A page that cannot load becomes a report line.
  let unchecked = false;
  const lanes: Promise<unknown>[] = Array(4).fill(Promise.resolve());
  const results = jobs.map((job, i) => {
    const r = lanes[i % 4]
      .then(() => checkOne(job))
      .catch((e: unknown) => {
        unchecked = true;
        if (!(e instanceof Unreachable)) return { out: [job.url, `  check crashed: ${String(e).split('\n')[0]}`], bad: true };
        return { out: [job.url, `  could not load: ${e.message}. Check the path, or start the server first.`], bad: true };
      });
    lanes[i % 4] = r;
    return r;
  });
  let failed = false;
  for (const r of results) {
    const { out, bad } = await r;
    console.log(out.join('\n'));
    failed ||= bad;
  }
  await browser.close();
  // 2: a page could not be checked at all (not loaded, or the check crashed); 1: checks found problems.
  process.exit(unchecked ? 2 : failed ? 1 : 0);
}

/** Parses the options of one command; --help prints that command's help, an unknown option its help and exit 2. */
function parse<T extends ParseArgsConfig['options']>(args: string[], options: T, help: string) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(help);
    process.exit(0);
  }
  try {
    return parseArgs({ args, allowPositionals: true, options });
  } catch (e) {
    console.error(`${(e as Error).message}\n\n${help}`);
    process.exit(2);
  }
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'check') {
  const { values, positionals } = parse(
    rest,
    {
      shots: { type: 'string' },
      strict: { type: 'boolean', default: false },
      wait: { type: 'string', default: '800' },
      open: { type: 'string', multiple: true, default: [] },
      'no-interact': { type: 'boolean', default: false },
      'no-axe': { type: 'boolean', default: false },
    },
    HELP_CHECK,
  );
  if (!positionals.length) {
    console.error(HELP_CHECK);
    process.exit(2);
  }
  for (const t of positionals)
    if (!t.includes('://') && !existsSync(t)) {
      console.error(`${t}: no such file. Pass a file path or a URL.`);
      process.exit(2);
    } else if (t.includes('://') && !URL.canParse(t)) {
      console.error(`${t}: not a valid URL. Write it in full, e.g. http://localhost:5173/.`);
      process.exit(2);
    }
  const wait = Number(values.wait);
  if (!Number.isFinite(wait) || wait < 0) {
    console.error(`--wait ${values.wait}: give the milliseconds to wait after load, e.g. --wait 800.`);
    process.exit(2);
  }
  await check(positionals, {
    shots: values.shots,
    strict: !!values.strict,
    wait,
    open: values.open ?? [],
    interact: !values['no-interact'],
    axe: !values['no-axe'],
  });
} else if (cmd === 'shots') {
  const { values, positionals } = parse(
    rest,
    {
      out: { type: 'string' },
      compare: { type: 'string' },
      diff: { type: 'string' },
      prune: { type: 'boolean', default: false },
      settle: { type: 'string', default: '1000' },
      threshold: { type: 'string', default: String(DEFAULT_TOLERANCE.threshold) },
      'max-diff': { type: 'string', default: String(DEFAULT_TOLERANCE.maxDiffPercent) },
    },
    HELP_SHOTS,
  );
  const fail = (msg: string) => {
    console.error(msg);
    process.exit(2);
  };
  if (!positionals.length || (!values.out && !values.compare)) fail(HELP_SHOTS);
  if (values.out && values.compare) fail('Give --out DIR (write baselines) or --compare DIR (check against them), not both.');
  if (values.prune && !values.out) fail('--prune goes with --out: it deletes the baselines in that folder that no page produced.');
  if (values.compare && !values.diff) fail('--compare needs --diff DIR: where the diff images and new shots go.');
  if (values.compare && !existsSync(values.compare)) fail(`${values.compare}: no such baseline folder. Write baselines first with --out.`);
  for (const t of positionals) if (!t.includes('://') && !existsSync(t)) fail(`${t}: no such file. Pass a file path or a URL.`);
  const settle = Number(values.settle);
  const threshold = Number(values.threshold);
  const maxDiff = Number(values['max-diff']);
  if (!Number.isFinite(settle) || settle < 0) fail(`--settle ${values.settle}: give milliseconds, e.g. --settle 1000.`);
  if (!(threshold >= 0 && threshold <= 1)) fail(`--threshold ${values.threshold}: give a color distance from 0 to 1, e.g. 0.1.`);
  if (!(maxDiff >= 0 && maxDiff <= 100)) fail(`--max-diff ${values['max-diff']}: give a percentage from 0 to 100, e.g. 0.02.`);
  await shots(positionals, {
    out: values.out,
    compare: values.compare,
    diff: values.diff,
    prune: !!values.prune,
    settle,
    tolerance: { threshold, maxDiffPercent: maxDiff },
  });
} else if (cmd === 'docs') {
  const { values, positionals } = parse(rest, { full: { type: 'boolean', default: false } }, HELP_DOCS);
  docs(positionals[0], !!values.full);
} else if (cmd === 'list') list();
else if (cmd === 'add') {
  const { values, positionals } = parse(rest, { force: { type: 'boolean', default: false } }, HELP_ADD);
  const templates = loadTemplates();
  const t = templates.find((x) => x.name === positionals[0]);
  if (!t) {
    console.error(
      `${positionals[0] ? `No template "${positionals[0]}". ` : ''}Templates:\n${templates.map((x) => `  ${x.name.padEnd(12)} ${x.description}`).join('\n')}\n\n${HELP_ADD}`,
    );
    process.exit(2);
  }
  const dir = resolve(positionals[1] ?? defaultDir(t.name, process.cwd()));
  console.log(addReport(t, dir, writeTemplate(t, dir, !!values.force), process.cwd()).join('\n'));
} else if (cmd === '--help' || cmd === '-h' || cmd === 'help' || !cmd) console.log(HELP);
else {
  console.error(`Unknown command "${cmd}".\n\n${HELP}`);
  process.exit(2);
}
