import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium, type Browser } from 'playwright';
import { measure, type Findings } from './measure.ts';

// measure() runs inside a real page; these fixtures are plain HTML with the class names the checks look for.
let browser: Browser | undefined;
let skip: string | false = false;

before(async () => {
  try {
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  } catch {
    skip = 'no Chromium (set CHROMIUM_PATH)';
  }
});
after(() => browser?.close());

async function run(body: string): Promise<Findings> {
  if (!browser) throw new Error('no browser');
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;font:16px sans-serif">${body}</body>`);
    return await page.evaluate(measure);
  } finally {
    await page.close();
  }
}

const btn = (label: string, h: number) => `<button style="height:${h}px;padding:0 12px">${label}</button>`;

test('toolbar row with controls of different heights fails', async (t) => {
  if (skip) return t.skip(skip);
  const res = await run(`<div class="ui-dt-actions" style="display:flex;gap:8px">${btn('篩選', 40)}${btn('排序', 40)}${btn('欄位', 32)}</div>`);
  assert.equal(res.mixed.length, 1);
  assert.match(res.mixed[0], /欄位/);
  assert.match(res.mixed[0], /32 px/);
});

test('toolbar row with one height passes, and a search field counts as one control', async (t) => {
  if (skip) return t.skip(skip);
  const res = await run(
    `<div class="ui-dt-tools" style="display:flex;gap:8px;align-items:center">
      <div class="ui-searchfield" style="height:40px;display:flex;align-items:center"><input style="height:24px"><button style="height:24px">清除</button></div>
      <div class="ui-dt-actions" style="display:flex;gap:8px">${btn('篩選', 40)}${btn('排序', 40)}</div>
    </div>`,
  );
  assert.deepEqual(res.mixed, []);
});

test('controls that wrapped onto another line are not compared', async (t) => {
  if (skip) return t.skip(skip);
  const res = await run(`<div role="toolbar" style="display:flex;flex-direction:column">${btn('篩選', 40)}${btn('欄位', 32)}</div>`);
  assert.deepEqual(res.mixed, []);
});

test('a status badge with a shadow in a table row or card fails; a flat one passes', async (t) => {
  if (skip) return t.skip(skip);
  const raised = '<span class="ui-badge" style="box-shadow:0 1px 2px rgba(0,0,0,.3)">失敗</span>';
  const flat = '<span class="ui-badge">完成</span>';
  const res = await run(
    `<div class="ui-dt-body"><div class="ui-dt-row">${raised}${flat}</div></div>
     <section class="ui-card">${raised}</section>
     <div>${raised}</div>`,
  );
  assert.equal(res.raised.length, 2);
  for (const r of res.raised) assert.match(r, /失敗/);
});

// The system's CSS sits in @layer ui; a page's unlayered reset on element selectors beats it.
const system = `<style>@layer ui.components { .ui-btn { padding: 0 var(--pad, 16px); margin: 0; border: 1px solid rgb(9, 9, 9); background: rgb(1, 2, 3); color: rgb(255, 255, 255); } .ui-card .ui-title { font-size: 20px; } }</style>`;
const ui = '<button class="ui-btn">儲存</button><div class="ui-card"><h2 class="ui-title">標題</h2></div>';

test('an unlayered reset on element selectors that overrides a component fails', async (t) => {
  if (skip) return t.skip(skip);
  const res = await run(`${system}<style>* { margin: 0; padding: 0; border: 0; } button { background: none; } h2 { font-size: 1em; }</style>${ui}`);
  assert.equal(res.unlayered.length, 3);
  assert.match(res.unlayered[0], /^\* \{ padding-top/);
  assert.match(res.unlayered[0], /\.ui-btn/);
  assert.match(res.unlayered[1], /^button \{ background-[a-z]+, background-[a-z]+ \} in a <style> element overrides \.ui-btn$/);
  assert.match(res.unlayered[2], /^h2 \{ font-size \} in a <style> element overrides \.ui-card \.ui-title/);
});

test('the same reset in @layer base, a rule on a class, an equal value or a plain element passes', async (t) => {
  if (skip) return t.skip(skip);
  const layered = await run(`${system}<style>@layer base { * { margin: 0; padding: 0; border: 0; } button { background: none; } }</style>${ui}`);
  assert.deepEqual(layered.unlayered, []);
  const own = await run(
    `${system}<style>.toolbar .ui-btn, :where(button) { background: none; } button { margin: 0; color: rgb(255, 255, 255); }</style>${ui}<p>text</p>`,
  );
  assert.deepEqual(own.unlayered, []);
  const plain = await run(`${system}<style>p, a { margin: 0; color: red; }</style><p>text</p>`);
  assert.deepEqual(plain.unlayered, []);
});
