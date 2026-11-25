/* ui shots: deterministic screenshots of pages, written as baselines or compared with them. */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import type { Browser, LaunchOptions, Page } from 'playwright';
import { compareShots, samePixels, type Tolerance } from './compare.ts';

export const WIDTHS = [390, 1280] as const;
export const THEMES = ['light', 'dark'] as const;
/** The time every shot sees (Date, timers, relative times): 2026/11/20（五）17:00 in Taipei. */
export const FIXED_TIME = '2026-11-20T17:00:00+08:00';

/** One target page and the stem its screenshots are named after. */
export interface Job {
  url: string;
  stem: string;
}

/** A name part made safe for a file name: only letters, digits, dot, dash and underscore remain (no colon or slash). */
export function cleanName(s: string): string {
  return s
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|-+$/g, '');
}

/**
 * The name a page's screenshots are filed under. A file: its name without the extension (Button.html → Button). A
 * page on a server: its path (http://localhost:5173/projects/42 → projects-42, / → index), so the pages of one site do
 * not overwrite each other. Then the query and the hash of either, sanitised (iframe.html?id=button--primary →
 * iframe-id-button-primary; settings#billing → settings-billing), so variants of one page get their own files.
 */
export function stemFor(url: string): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return cleanName(url) || 'page';
  }
  const decode = (s: string) => {
    try {
      return decodeURIComponent(s.replace(/\+/g, ' '));
    } catch {
      return s;
    }
  };
  const query = [...u.searchParams].map(([k, v]) => (v ? `${k}-${v}` : k)).join('-');
  const hash = decode(u.hash.slice(1));
  const path = decode(u.pathname).replace(/\/+$/, '');
  const base =
    u.protocol === 'file:'
      ? (path.split('/').pop() ?? '').replace(/\.[^.]*$/, '')
      : path
          .replace(/\.html?$/i, '')
          .split('/')
          .filter(Boolean)
          .join('-') || 'index';
  return cleanName([base, query, hash].filter(Boolean).join('-')) || 'page';
}

/** Turns paths and URLs into jobs, named by stemFor; a second target with the same name gets -2, -3, … */
export function jobsFor(targets: string[], toUrl: (t: string) => string): Job[] {
  const stems = new Map<string, number>();
  return targets.map((target) => {
    const url = toUrl(target);
    const base = stemFor(url);
    const n = (stems.get(base) ?? 0) + 1;
    stems.set(base, n);
    return { url, stem: n > 1 ? `${base}-${n}` : base };
  });
}

/**
 * Switches a loaded page to a theme. A page on bundle.js: the system's own setTheme, which also moves the accent's
 * derived colors to the theme, so the dark pass is dark whatever the page did at load. Other pages: the attribute,
 * if it uses one. Runs inside the page.
 */
export function applyTheme(t: 'light' | 'dark') {
  const r = document.documentElement;
  const ui = (window as unknown as { UI?: { setTheme?: (t: 'light' | 'dark') => void } }).UI;
  if (typeof ui?.setTheme === 'function') ui.setTheme(t);
  else if (r.hasAttribute('data-theme')) r.setAttribute('data-theme', t);
}

/**
 * The browser for screenshots. CHROMIUM_PATH when set; otherwise Playwright's full Chromium (channel "chromium",
 * new headless mode) rather than the headless shell, so local runs and CI render through the same kind of build.
 */
export function shotLaunchOptions(): LaunchOptions {
  return process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chromium' };
}

/**
 * Makes a full-page screenshot hold what scrolls inside the page's own scroll container. A frame such as AppShell
 * keeps the document at the window's height and scrolls its main area (.ui-shell-main), so a full-page shot would
 * stop at the window's bottom edge. When the document does not scroll but one large element (at least 60 % of the
 * window's height) does, the viewport grows by what that element hides, up to 12000 px, until nothing is hidden.
 * Content that renders late (data after a fetch, a list after fonts) changes the scroll height: the height is measured
 * again after each settle step until two measurements in a row agree. Returns the viewport to restore.
 */
export async function growToScrollContainer(
  page: Page,
  viewport: { width: number; height: number },
  settle: () => Promise<void>,
): Promise<{ width: number; height: number }> {
  let size = viewport;
  let last = '';
  for (let i = 0; i < 10; i++) {
    const m = await page.evaluate(() => {
      const doc = document.scrollingElement ?? document.documentElement;
      if (doc.scrollHeight > innerHeight + 1) return { hidden: 0, key: `doc ${doc.scrollHeight}` };
      let most = 0;
      let key = 'none';
      for (const el of document.body.querySelectorAll('*')) {
        if (el.clientHeight < innerHeight * 0.6) continue;
        const cs = getComputedStyle(el);
        if (!/auto|scroll/.test(cs.overflowY) || cs.display === 'none') continue;
        const hidden = el.scrollHeight - el.clientHeight;
        if (hidden >= most) {
          most = hidden;
          key = `box ${el.scrollHeight}`;
        }
      }
      return { hidden: most, key: `${key} ${innerHeight}` };
    });
    if (m.hidden > 1 && size.height < 12000) {
      size = { width: size.width, height: Math.min(12000, size.height + Math.ceil(m.hidden)) };
      await page.setViewportSize(size);
    } else if (m.key === last) break;
    last = m.key;
    await settle();
  }
  return size;
}

/**
 * Waits until the page's animations and transitions have finished, up to `cap` ms. Endless ones (a spinner, a
 * skeleton's shimmer) and paused ones are not waited for. Animations that start while waiting are waited for too.
 * For ui check, on the real clock (ui shots stops animations instead).
 */
export async function waitForAnimations(page: Page, cap = 1500): Promise<void> {
  await page.evaluate(async (cap) => {
    const end = performance.now() + cap;
    const moving = () =>
      document.getAnimations().filter((a) => {
        if (a.playState !== 'running' && !a.pending) return false;
        const t = a.effect?.getComputedTiming();
        return !!t && Number.isFinite(t.endTime);
      });
    const frame = () => new Promise((ok) => requestAnimationFrame(() => ok(undefined)));
    for (let list = moving(); list.length && performance.now() < end; list = moving()) {
      const left = end - performance.now();
      await Promise.race([Promise.all(list.map((a) => a.finished.catch(() => undefined))), new Promise((ok) => setTimeout(ok, left))]);
      // What the end of an animation sets off (a row removed on animationend, the next step) starts in the next frame.
      await frame();
    }
    await frame();
  }, cap);
}

/** File name of one screenshot. */
export const shotName = (stem: string, width: number, theme: string) => `${stem}-${width}-${theme}.png`;

/**
 * Takes the 4 screenshots of one page (2 widths x 2 themes), each in a fresh context, and returns them by file name.
 * Deterministic: fixed clock (timers only advance by `settle` ms of fake time), reduced motion, animations stopped,
 * caret hidden, fonts loaded, device scale factor 1, full page, fixed locale and time zone. The clock starts at FIXED_TIME and runs `settle` + 100 ms of fake time.
 */
export async function shootPage(browser: Browser, job: Job, settle: number): Promise<Map<string, Buffer>> {
  const shots = new Map<string, Buffer>();
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      const phone = width === 390;
      const viewport = { width, height: phone ? 844 : 900 };
      const ctx = await browser.newContext({
        viewport,
        colorScheme: theme,
        reducedMotion: 'reduce',
        hasTouch: phone,
        isMobile: phone,
        deviceScaleFactor: 1,
        locale: 'zh-TW',
        timezoneId: 'Asia/Taipei',
      });
      try {
        const page = await ctx.newPage();
        // Fake timers, paused: Date, setTimeout, setInterval and requestAnimationFrame only move when runFor moves
        // them, so a ticking demo (a progress bar on an interval) is caught at the same frame every time.
        await page.clock.install({ time: Date.parse(FIXED_TIME) - 60_000 });
        await page.clock.pauseAt(Date.parse(FIXED_TIME));
        const resp = await page.goto(job.url, { waitUntil: 'load' });
        if (resp && !resp.ok()) throw new Error(`HTTP ${resp.status()}`);
        // Data the page fetches after load (and the fonts it then needs) is part of the shot. A page that polls never
        // goes idle: after 5 s the shot goes ahead.
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);
        const fonts = () => page.evaluate(() => document.fonts.ready.then(() => undefined));
        await fonts();
        await page.evaluate(applyTheme, theme);
        await page.clock.runFor(settle);
        await fonts();
        // A component that measured itself with the fallback font before the web fonts arrived can keep a stale
        // state (an overflow fade on a row that now fits). A 1 px resize and back makes every ResizeObserver measure
        // again with the final fonts, as any real window resize would.
        for (const size of [{ ...viewport, width: width + 1 }, viewport]) {
          await page.setViewportSize(size);
          await page.waitForTimeout(100);
          await page.clock.runFor(100);
        }
        // Overflow fades and other scroll-driven state are recomputed on scroll: one scroll event on every scroll
        // container makes them read the final layout, as the user's first scroll would (Tabs can keep a fade from
        // its first measure on a row that now fits).
        await page.evaluate(() => {
          for (const el of document.querySelectorAll('*')) {
            const { overflowX, overflowY } = getComputedStyle(el);
            if (/auto|scroll/.test(overflowX + overflowY)) el.dispatchEvent(new Event('scroll'));
          }
        });
        await page.waitForTimeout(100);
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);
        await fonts();
        await growToScrollContainer(page, viewport, async () => {
          await page.waitForTimeout(100);
          await page.clock.runFor(100);
          await fonts();
        });
        // A short real wait lets ResizeObserver callbacks and the renders they cause (not timer-driven) settle;
        // then shots until two in a row are the same, as Playwright's toHaveScreenshot does.
        await page.waitForTimeout(200);
        const shoot = () => page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide', scale: 'css' });
        let shot = await shoot();
        for (let i = 0; i < 4; i++) {
          await page.waitForTimeout(100);
          const next = await shoot();
          if (next.equals(shot)) break;
          shot = next;
        }
        shots.set(shotName(job.stem, width, theme), shot);
      } finally {
        await ctx.close();
      }
    }
  }
  return shots;
}

export interface ShotResult {
  name: string;
  status: 'written' | 'kept' | 'same' | 'changed' | 'new';
  detail?: string;
}

/**
 * Writes shots as baselines. A baseline with exactly the same pixels is kept as it is, so regenerating
 * leaves no churn in git. New files are Playwright's PNGs, made smaller losslessly by oxipng when it is on PATH.
 */
export function writeShots(shots: Map<string, Buffer>, dir: string): ShotResult[] {
  mkdirSync(dir, { recursive: true });
  const results = [...shots].map(([name, png]): ShotResult => {
    const path = join(dir, name);
    if (existsSync(path) && samePixels(readFileSync(path), png)) return { name, status: 'kept' };
    writeFileSync(path, png);
    return { name, status: 'written' };
  });
  optimizePngs(results.filter((r) => r.status === 'written').map((r) => join(dir, r.name)));
  return results;
}

let oxipng: boolean | undefined;
/** Lossless PNG optimisation with oxipng (about 35 % smaller than Playwright's PNGs); skipped when it is not installed. */
export function optimizePngs(paths: string[]): boolean {
  if (oxipng === undefined) {
    try {
      execFileSync('oxipng', ['--version'], { stdio: 'ignore' });
      oxipng = true;
    } catch {
      oxipng = false;
    }
  }
  if (oxipng && paths.length) execFileSync('oxipng', ['--opt', '4', '--strip', 'safe', '--quiet', ...paths], { stdio: 'inherit' });
  return oxipng;
}

const pct = (n: number) => `${n.toFixed(4)} %`;

/**
 * Compares shots with the baselines in baseDir. For each changed or new shot, diffDir gets <name>-actual.png
 * (the new shot), and for a changed one also <name>-expected.png and <name>-diff.png (differences in red).
 */
export function compareWithBaselines(shots: Map<string, Buffer>, baseDir: string, diffDir: string, tol: Tolerance): ShotResult[] {
  return [...shots].map(([name, png]) => {
    const base = join(baseDir, name);
    const stem = name.replace(/\.png$/, '');
    if (!existsSync(base)) {
      mkdirSync(diffDir, { recursive: true });
      writeFileSync(join(diffDir, `${stem}-actual.png`), png);
      return { name, status: 'new', detail: 'no baseline' };
    }
    const c = compareShots(readFileSync(base), png, tol);
    const detail = c.sizes
      ? `size ${c.sizes.expected.join('x')} px -> ${c.sizes.actual.join('x')} px, ${c.diffPixels} px differ`
      : `${c.diffPixels} px differ (${pct(c.diffPercent)}, allowed ${pct(tol.maxDiffPercent)})`;
    if (!c.changed) return { name, status: 'same', detail: c.diffPixels ? detail : undefined };
    mkdirSync(diffDir, { recursive: true });
    writeFileSync(join(diffDir, `${stem}-actual.png`), png);
    copyFileSync(base, join(diffDir, `${stem}-expected.png`));
    if (c.diff) writeFileSync(join(diffDir, `${stem}-diff.png`), c.diff);
    return { name, status: 'changed', detail };
  });
}

/** Names of the shots that differ from their baseline beyond the tolerance, or have none. Writes nothing. */
export function changedShots(shots: Map<string, Buffer>, baseDir: string, tol: Tolerance): string[] {
  return [...shots]
    .filter(([name, png]) => {
      const base = join(baseDir, name);
      return !existsSync(base) || compareShots(readFileSync(base), png, tol).changed;
    })
    .map(([name]) => name);
}

/** Baselines in baseDir that no shot of this run produced (a removed or renamed page). */
export function orphanBaselines(baseDir: string, names: Set<string>): string[] {
  if (!existsSync(baseDir)) return [];
  return readdirSync(baseDir)
    .filter((f) => f.endsWith('.png') && !names.has(f))
    .sort();
}

/** The Markdown summary written next to the diffs (and shown in the CI job summary). */
export function summaryMarkdown(results: ShotResult[], orphans: string[], baseDir: string): string {
  const changed = results.filter((r) => r.status === 'changed');
  const added = results.filter((r) => r.status === 'new');
  const lines = [`# 畫面比對`, '', `${results.length} 張截圖：${changed.length} 張改變、${added.length} 張沒有基準圖。`, ''];
  if (changed.length) lines.push('## 改變', '', ...changed.map((r) => `- \`${r.name}\`: ${r.detail}`), '');
  if (added.length) lines.push('## 沒有基準圖', '', ...added.map((r) => `- \`${r.name}\``), '');
  if (orphans.length > 12) lines.push(`${baseDir} 中另有 ${orphans.length} 張基準圖不在這次比對的頁面內。`, '');
  else if (orphans.length) lines.push(`## ${baseDir} 中沒有對應頁面的基準圖`, '', ...orphans.map((f) => `- \`${f}\``), '');
  if (changed.length || added.length)
    lines.push(
      '若改變符合預期：在 GitHub 上執行 Update visual baselines workflow（Actions → Update visual baselines → Run workflow，選這個分支），它會重新產生基準圖並 commit 到該分支。',
      '',
    );
  return lines.join('\n');
}
