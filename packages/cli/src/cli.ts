#!/usr/bin/env node
/* ui: the command-line tools of @seanyeh77/ui.
     ui check <file or URL>...   the automatic part of "Before you finish"
     ui shots <file or URL>...   deterministic screenshots: write baselines (--out) or compare with them (--compare)
     ui docs [Name] [--full]     a component's 用法 block (--full: the whole README), a guide, or the list of docs
     ui list                     every guide and component with its one-line description */
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { measure } from './measure';
import { summary, usageBlock } from './usage';
import { DEFAULT_TOLERANCE, type Tolerance } from './compare';
import {
  applyTheme,
  changedShots,
  compareWithBaselines,
  jobsFor,
  optimizePngs,
  orphanBaselines,
  shootPage,
  shotLaunchOptions,
  summaryMarkdown,
  writeShots,
  FIXED_TIME,
  type ShotResult,
} from './shots';

const HELP = `ui check <file or URL>... [--shots DIR] [--strict] [--wait MS]
  Opens each page at 390 px and 1280 px, light and dark, and fails (exit 1) on:
  console errors, horizontal overflow at 390 px, touch targets under 48 px, touch areas that spill past their control, a card inside a card,
  raw Markdown, native controls the design system replaces, wrapped buttons, tabs, headers or headings, controls of
  different heights in one toolbar row, and a status badge with a shadow in a table or card.
  Exits 2 when a page cannot be checked at all: it does not load, or the check itself crashes.
ui docs [Name] [--full]
  Prints the 用法 block of a component (Button, DataTable…): what it is, a minimal example and the rules most often
  gotten wrong. --full prints the whole README. Guides print whole: guidelines (the core rules every page needs),
  layout, forms, data, monitoring, code, theme, motion. Without a name, lists every doc.
ui shots <file or URL>... (--out DIR [--prune] | --compare DIR --diff DIR) [--settle MS] [--threshold N] [--max-diff PERCENT]
  Deterministic screenshots at 390 px and 1280 px, light and dark (DIR/<name>-<width>-<theme>.png): fixed clock
  (${FIXED_TIME}, fake timers), reduced motion, animations stopped, caret hidden, fonts loaded, scale 1, full page.
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
  Exits 2 when a page cannot be opened. Uses CHROMIUM_PATH, else Playwright's full Chromium (channel chromium).
ui list          lists every guide and component with its one-line description`;

function docsDir(): string {
  const require = createRequire(import.meta.url);
  return join(dirname(require.resolve('@seanyeh77/ui/package.json')), 'docs');
}

/** Guides (lowercase file names) first, then the components. */
function docFiles(dir: string): string[] {
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  const guide = (f: string) => (/^[a-z]/.test(f) ? 0 : 1);
  return files.sort((a, b) => guide(a) - guide(b) || (a === 'guidelines.md' ? -1 : b === 'guidelines.md' ? 1 : a.localeCompare(b)));
}

function docs(name: string | undefined, full: boolean) {
  const dir = docsDir();
  const files = docFiles(dir);
  if (!name) return console.log(files.map((f) => f.slice(0, -3)).join('\n'));
  const hit = files.find((f) => f.slice(0, -3).toLowerCase() === name.toLowerCase());
  if (!hit) {
    console.error(`No docs for "${name}". Run "ui docs" for the list.`);
    process.exit(1);
  }
  const md = readFileSync(join(dir, hit), 'utf8');
  const usage = full ? null : usageBlock(md);
  if (!usage) return console.log(md);
  console.log(usage + `\n(用法 only. The whole README: ui docs ${hit.slice(0, -3)} --full)`);
}

function list() {
  const dir = docsDir();
  for (const f of docFiles(dir)) {
    const md = readFileSync(join(dir, f), 'utf8');
    // A guide is described by its title; a component by the first sentence of its 用法 block.
    const line = /^[a-z]/.test(f) ? (/^# (.+)$/m.exec(md)?.[1] ?? '') : summary(md);
    console.log(`${f.slice(0, -3).padEnd(18)} ${line}`);
  }
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

async function check(targets: string[], opts: { shots?: string; strict: boolean; wait: number }) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}).catch((e: unknown) => {
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
    for (const width of [390, 1280]) {
      for (const theme of ['light', 'dark'] as const) {
        const phone = width === 390;
        const ctx = await browser.newContext({
          viewport: { width, height: phone ? 844 : 900 },
          colorScheme: theme,
          hasTouch: phone,
          isMobile: phone,
          deviceScaleFactor: phone ? 2 : 1,
        });
        try {
          const page = await ctx.newPage();
          const errors: string[] = [];
          page.on('pageerror', (e) => errors.push(String(e)));
          page.on('console', (m) => {
            if (m.type() !== 'error') return;
            const src = m.location().url;
            // Chromium asks every server for /favicon.ico; a missing one is not the page's error.
            if (/\/favicon\.ico$/.test(src)) return;
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
          const res = await run(() => page.evaluate(measure));
          if (page.url() !== url && width === 390 && theme === 'light') out.push(`  (redirected to ${page.url()})`);
          const problems: string[] = [];
          if (errors.length) problems.push('console errors: ' + errors.slice(0, 5).join(' | '));
          if (res.nested.length) problems.push('card inside a card (two shadows): ' + res.nested.join('; '));
          if (res.markdown.length) problems.push('raw Markdown shown: ' + res.markdown.join('; '));
          if (res.native.length) problems.push('native controls: ' + [...new Set(res.native)].join('; '));
          if (res.wrapped.length) problems.push('text that must stay on one line wraps: ' + res.wrapped.join('; '));
          if (res.mixed.length)
            problems.push(
              'controls of different heights in one toolbar row: ' +
                res.mixed.join('; ') +
                '. Use the system controls (Button, IconButton, SearchField, Select: 40 px) without your own height or padding.',
            );
          if (res.raised.length)
            problems.push(
              'status badge with a shadow in a table or card: ' +
                res.raised.join('; ') +
                '. Inside a table or card a Badge is a dot and text: remove your own box-shadow or chip styles.',
            );
          if (phone) {
            if (res.overflow.length) problems.push('horizontal overflow: ' + res.overflow.join('; '));
            if (res.escaped.length) problems.push('touch area larger than its control (covers other controls): ' + res.escaped.join('; '));
            if (res.small.length)
              problems.push(
                `touch targets under 48 px: ${res.small.slice(0, 12).join('; ')}${res.small.length > 12 ? ` (+${res.small.length - 12} more)` : ''}`,
              );
            if (res.inline.length && opts.strict) problems.push('inline targets under 48 px: ' + res.inline.slice(0, 12).join('; '));
          }
          out.push(`  ${width} px ${theme}: ${problems.length ? '' : 'ok'}`);
          for (const p of problems) out.push('    - ' + p);
          if (phone && theme === 'light' && res.inline.length && !opts.strict) out.push(`    (inline text targets, exempt: ${res.inline.length})`);
          bad ||= problems.length > 0;
          if (opts.shots) {
            await page.screenshot({ path: join(opts.shots, `${stem}-${width}-${theme}.png`), fullPage: true });
          }
        } finally {
          await ctx.close();
        }
      }
    }
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

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'check') {
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: { shots: { type: 'string' }, strict: { type: 'boolean', default: false }, wait: { type: 'string', default: '800' } },
  });
  if (!positionals.length) {
    console.error(HELP);
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
  await check(positionals, { shots: values.shots, strict: !!values.strict, wait });
} else if (cmd === 'shots') {
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      out: { type: 'string' },
      compare: { type: 'string' },
      diff: { type: 'string' },
      prune: { type: 'boolean', default: false },
      settle: { type: 'string', default: '1000' },
      threshold: { type: 'string', default: String(DEFAULT_TOLERANCE.threshold) },
      'max-diff': { type: 'string', default: String(DEFAULT_TOLERANCE.maxDiffPercent) },
    },
  });
  const fail = (msg: string) => {
    console.error(msg);
    process.exit(2);
  };
  if (!positionals.length || (!values.out && !values.compare)) fail(HELP);
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
  const { values, positionals } = parseArgs({ args: rest, allowPositionals: true, options: { full: { type: 'boolean', default: false } } });
  docs(positionals[0], !!values.full);
} else if (cmd === 'list') list();
else {
  console.log(HELP);
  process.exit(cmd ? 2 : 0);
}
