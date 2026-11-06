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

async function check(targets: string[], opts: { shots?: string; strict: boolean; wait: number }) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  let failed = false;
  for (const target of targets) {
    const url = target.includes('://') ? target : pathToFileURL(resolve(target)).href;
    console.log(url);
    for (const width of [390, 1280]) {
      for (const theme of ['light', 'dark'] as const) {
        const phone = width === 390;
        const ctx = await browser.newContext({ viewport: { width, height: phone ? 844 : 900 }, colorScheme: theme, hasTouch: phone, isMobile: phone, deviceScaleFactor: phone ? 2 : 1 });
        const page = await ctx.newPage();
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        page.on('console', (m) => {
          if (m.type() === 'error') errors.push(m.text());
        });
        await page.goto(url, { waitUntil: 'load' });
        await page.evaluate((t) => {
          const r = document.documentElement;
          if (r.hasAttribute('data-theme') || 'UI' in window) r.setAttribute('data-theme', t);
        }, theme);
        await page.waitForTimeout(opts.wait);
        const res = await page.evaluate(measure);
        const problems: string[] = [];
        if (errors.length) problems.push('console errors: ' + errors.slice(0, 5).join(' | '));
        if (res.nested.length) problems.push('card inside a card (two shadows): ' + res.nested.join('; '));
        if (res.markdown.length) problems.push('raw Markdown shown: ' + res.markdown.join('; '));
        if (res.native.length) problems.push('native controls: ' + [...new Set(res.native)].join('; '));
        if (res.wrapped.length) problems.push('text that must stay on one line wraps: ' + res.wrapped.join('; '));
        if (phone) {
          if (res.overflow.length) problems.push('horizontal overflow: ' + res.overflow.join('; '));
          if (res.small.length) problems.push(`touch targets under 48 px: ${res.small.slice(0, 12).join('; ')}${res.small.length > 12 ? ` (+${res.small.length - 12} more)` : ''}`);
          if (res.inline.length && opts.strict) problems.push('inline targets under 48 px: ' + res.inline.slice(0, 12).join('; '));
        }
        console.log(`  ${width} px ${theme}: ${problems.length ? '' : 'ok'}`);
        for (const p of problems) console.log('    - ' + p);
        if (phone && theme === 'light' && res.inline.length && !opts.strict) console.log(`    (inline text targets, exempt: ${res.inline.length})`);
        failed ||= problems.length > 0;
        if (opts.shots) {
          mkdirSync(opts.shots, { recursive: true });
          const stem = (url.replace(/\/$/, '').split('/').pop() || 'page').replace(/\.[^.]*$/, '');
          await page.screenshot({ path: join(opts.shots, `${stem}-${width}-${theme}.png`), fullPage: true });
        }
        await ctx.close();
      }
    }
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'check') {
  const { values, positionals } = parseArgs({ args: rest, allowPositionals: true, options: { shots: { type: 'string' }, strict: { type: 'boolean', default: false }, wait: { type: 'string', default: '800' } } });
  if (!positionals.length) {
    console.error(HELP);
    process.exit(2);
  }
  for (const t of positionals) if (!t.includes('://') && !existsSync(t)) {
    console.error(`${t}: no such file. Pass a file path or a URL.`);
    process.exit(2);
  }
  await check(positionals, { shots: values.shots, strict: !!values.strict, wait: Number(values.wait) });
} else if (cmd === 'docs') docs(rest[0]);
else if (cmd === 'list') list();
else {
  console.log(HELP);
  process.exit(cmd ? 2 : 0);
}
