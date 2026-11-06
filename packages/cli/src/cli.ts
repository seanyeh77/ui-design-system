#!/usr/bin/env node
/* ui: the command-line tools of @seanyeh77/ui.
     ui check <file or URL>...   the automatic part of "Before you finish"
     ui docs [Name]              a component's README (or the list of docs)
     ui list                     every component with its one-line description */
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { measure } from './measure';

const HELP = `ui check <file or URL>... [--shots DIR] [--strict] [--wait MS]
  Opens each page at 390 px and 1280 px, light and dark, and fails (exit 1) on:
  console errors, horizontal overflow at 390 px, touch targets under 48 px, a card inside a card,
  raw Markdown, native controls the design system replaces, and wrapped buttons, tabs, headers or headings.
  Exits 2 when a page cannot be checked at all: it does not load, or the check itself crashes.
ui docs [Name]   prints the README of a component (Button, DataTable…) or a guide (guidelines, layout, motion)
ui list          lists every component`;

function docsDir(): string {
  const require = createRequire(import.meta.url);
  return join(dirname(require.resolve('@seanyeh77/ui/package.json')), 'docs');
}

function docs(name?: string) {
  const dir = docsDir();
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  if (!name) return console.log(files.map((f) => f.slice(0, -3)).join('\n'));
  const hit = files.find((f) => f.slice(0, -3).toLowerCase() === name.toLowerCase());
  if (!hit) {
    console.error(`No docs for "${name}". Run "ui docs" for the list.`);
    process.exit(1);
  }
  console.log(readFileSync(join(dir, hit), 'utf8'));
}

function list() {
  const dir = docsDir();
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md') && /^[A-Z]/.test(x))) {
    const lines = readFileSync(join(dir, f), 'utf8').split('\n');
    const first = lines.find((l) => l.trim() && !l.startsWith('#')) ?? '';
    console.log(`${f.slice(0, -3).padEnd(18)} ${first.trim()}`);
  }
}

/** The page itself could not be opened: a wrong path, no server, or an HTTP error. */
class Unreachable extends Error {}

async function check(targets: string[], opts: { shots?: string; strict: boolean; wait: number }) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}).catch((e: unknown) => {
    console.error(String(e).split('\n')[0]);
    console.error('No Chromium for ui check. Run `npx playwright install chromium`, or set CHROMIUM_PATH to an installed Chrome or Chromium.');
    process.exit(2);
  });
  const stems = new Map<string, number>();
  const jobs = targets.map((target) => {
    // Chromium normalizes URLs (trailing slash, case, escapes); compare against the same form.
    const url = target.includes('://') ? new URL(target).href : pathToFileURL(resolve(target)).href;
    // Screenshot names come from the file name; a second target with the same name gets -2, -3, …
    const base = (url.replace(/\/$/, '').split('/').pop() || 'page').replace(/\.[^.]*$/, '');
    const n = (stems.get(base) ?? 0) + 1;
    stems.set(base, n);
    return { url, stem: n > 1 ? `${base}-${n}` : base };
  });

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
          await run(() =>
            page.evaluate((t) => {
              const r = document.documentElement;
              if (r.hasAttribute('data-theme') || 'UI' in window) r.setAttribute('data-theme', t);
            }, theme),
          );
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
          if (phone) {
            if (res.overflow.length) problems.push('horizontal overflow: ' + res.overflow.join('; '));
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
} else if (cmd === 'docs') docs(rest[0]);
else if (cmd === 'list') list();
else {
  console.log(HELP);
  process.exit(cmd ? 2 : 0);
}
