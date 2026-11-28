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

async function run(body: string, width = 1280): Promise<Findings> {
  if (!browser) throw new Error('no browser');
  const page = await browser.newPage({ viewport: { width, height: 800 } });
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

test('a tab list counts as one control: 32 px tabs in a 40 px segmented control pass, a 32 px list fails', async (t) => {
  if (skip) return t.skip(skip);
  const tabs = (h: number) =>
    `<div role="tablist" style="height:${h}px;padding:4px;box-sizing:border-box;display:flex"><button role="tab" style="height:32px">全部 4</button><button role="tab" style="height:32px">失敗 1</button></div>`;
  const ok = await run(`<div class="ui-dt-tools" style="display:flex;gap:8px;align-items:center">${tabs(40)}${btn('排序', 40)}</div>`);
  assert.deepEqual(ok.mixed, []);
  const bad = await run(`<div class="ui-dt-tools" style="display:flex;gap:8px;align-items:center">${tabs(32)}${btn('排序', 40)}</div>`);
  assert.equal(bad.mixed.length, 1);
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

const long = 'Routing between autonomous systems with BGP and the router requirements';

test('a wrapped heading in Markdown content passes; a wrapped interface heading still fails', async (t) => {
  if (skip) return t.skip(skip);
  const res = await run(
    `<div class="ui-md" style="width:200px"><h4 class="ui-md-h">${long}</h4></div>
     <section class="ui-card" style="width:200px"><h2 class="ui-card-title">${long}</h2></section>`,
    390,
  );
  assert.equal(res.wrapped.length, 1);
  assert.match(res.wrapped[0], /^h2/);
});

test('a list item that is one link passes when the link fills a 48 px row, and fails at text height', async (t) => {
  if (skip) return t.skip(skip);
  const row = (h: string) =>
    `<ul class="ui-md"><li class="ui-md-rowitem"><a class="ui-md-link is-row" href="#rfc1812" style="display:flex;align-items:center;min-height:${h}">RFC 1812: IPv4 router requirements</a></li></ul>`;
  const tall = await run(row('48px'), 390);
  assert.deepEqual(tall.small, []);
  assert.deepEqual(tall.inline, []);
  const short = await run(row('0'), 390);
  assert.equal(short.small.length, 1);
  assert.match(short.small[0], /RFC 1812/);
});

test('a one-line code block and a scrolling table frame are content, not touch targets', async (t) => {
  if (skip) return t.skip(skip);
  const res = await run(
    `<div class="ui-cv"><pre class="ui-cv-body" tabindex="0" style="margin:0;overflow-y:auto;overflow-x:hidden;line-height:20px">make test</pre></div>
     <div class="ui-md-table-wrap" tabindex="0" role="region" aria-label="測資" style="overflow-x:auto;height:40px">表格</div>`,
    390,
  );
  assert.deepEqual(res.small, []);
  // A focusable element that does not scroll, or a control that scrolls, is still a target.
  const still = await run(
    `<div tabindex="0" style="height:20px">一列</div><div role="slider" tabindex="0" aria-valuenow="1" style="overflow:auto;height:20px">1</div>`,
    390,
  );
  assert.equal(still.small.length, 2);
});

test('the viewport meta is reported as there or missing', async (t) => {
  if (skip) return t.skip(skip);
  assert.equal((await run('<p>text</p>', 390)).viewportMeta, false);
  assert.equal((await run('<meta name="viewport" content="width=device-width, initial-scale=1"><p>text</p>', 390)).viewportMeta, true);
});

test('a row link is not a small target when its whole row opens it', async (t) => {
  if (skip) return t.skip(skip);
  const res = await run(
    `<table><tbody><tr class="ui-dt-row" style="cursor:pointer;height:52px"><td><a class="ui-dt-rowlink" href="#a">api-gateway</a></td></tr></tbody></table>
     <div class="ui-card" style="cursor:pointer;height:120px"><a href="#b">專案 A</a></div>`,
    390,
  );
  assert.deepEqual(res.small, []);
  assert.equal(res.inline.length, 2);
  // A link in a row that does nothing on its own is still a small target.
  const alone = await run(`<ul><li style="height:52px"><a href="#c" style="display:inline-block;height:20px">文件</a></li></ul>`, 390);
  assert.equal(alone.small.length, 1);
});

test('interface text cut off without a tooltip or title fails; with one it passes; Markdown content is left out', async (t) => {
  if (skip) return t.skip(skip);
  const box = 'style="width:80px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:block"';
  const res = await run(
    `<button class="ui-btn" ${box}>部署全部的服務到正式環境</button>
     <button class="ui-btn" ${box} title="部署全部的服務到正式環境">部署全部的服務到正式環境</button>
     <span data-ui-tip="t1"><h3 ${box}>每個節點的平均使用率與峰值</h3></span>
     <div class="ui-md"><h3 ${box}>每個節點的平均使用率與峰值</h3></div>
     <h2 class="ui-card-title" style="width:400px;overflow:hidden">短標題</h2>`,
  );
  assert.equal(res.truncated.length, 1);
  assert.match(res.truncated[0], /button\.ui-btn/);
});

test('text past the edge of its card fails; text in a scroll box inside the card passes', async (t) => {
  if (skip) return t.skip(skip);
  const res = await run(
    `<div class="ui-card" style="width:200px;height:120px;position:relative;margin:40px">
       <svg width="200" height="120" style="overflow:visible"><text x="-30" y="60">2026-11</text></svg>
     </div>
     <div class="ui-card" style="width:200px;margin:40px"><div style="overflow-x:auto"><div style="width:600px">很長很長的表格列 ${'資料 '.repeat(30)}</div></div></div>`,
  );
  assert.equal(res.outside.length, 1);
  assert.match(res.outside[0], /2026-11/);
});

test('targets under 24 px fail next to another target and pass with room around them (WCAG 2.5.8)', async (t) => {
  if (skip) return t.skip(skip);
  const b = (x: number) => `<button style="position:absolute;left:${x}px;top:20px;width:16px;height:16px;padding:0;border:0" aria-label="b${x}"></button>`;
  const crowded = await run(b(10) + b(30));
  assert.equal(crowded.small24.length, 2);
  const spaced = await run(b(10) + b(60));
  assert.deepEqual(spaced.small24, []);
  const big = await run(`<button style="width:24px;height:24px" aria-label="a"></button><button style="width:24px;height:24px" aria-label="b"></button>`);
  assert.deepEqual(big.small24, []);
});

test('a link cut off by its cell is no neighbor where it runs on under the next cell (WCAG 2.5.8)', async (t) => {
  if (skip) return t.skip(skip);
  // Two cells of 120 px: a 300 px link in the first is cut at 120 px; the second holds a 22 px focusable text.
  const row = (clip: string) =>
    `<div style="display:flex;width:240px;line-height:22px">
       <div style="width:120px;${clip}white-space:nowrap"><a href="#a" style="display:inline-block;width:300px">codemap/a.go:1</a></div>
       <span tabindex="0" style="display:block;width:120px">long text</span>
     </div>`;
  const shown = await run(row(''));
  assert.equal(shown.small24.length, 1);
  assert.match(shown.small24[0], /next to a "codemap\/a.go:1"/);
  const cut = await run(row('overflow:hidden;'));
  assert.deepEqual(cut.small24, []);
});

const field = (label: string, control: string) =>
  `<div class="ui-field" style="display:flex;flex-direction:column;gap:6px"><label class="ui-field-label">${label}</label>${control}</div>`;
const input = (h: number) => `<input class="ui-input" style="height:${h}px;box-sizing:border-box">`;

test('fields of one form row with different control heights fail; a TextArea and the next row do not count', async (t) => {
  if (skip) return t.skip(skip);
  const grid = (cells: string) => `<div class="ui-formgrid-in" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start">${cells}</div>`;
  const bad = await run(grid(field('名稱', input(40)) + field('標籤', `<div class="ui-ms" style="height:42px;box-sizing:border-box;border:1px solid"></div>`)));
  assert.equal(bad.formMixed.length, 1);
  assert.match(bad.formMixed[0], /標籤" 42 px/);
  const ok = await run(
    grid(field('名稱', input(40)) + field('Email', input(40)) + field('備註', '<textarea style="height:96px"></textarea>') + field('電話', input(40))),
  );
  assert.deepEqual(ok.formMixed, []);
  const flexRow = await run(`<div style="display:flex;gap:16px">${field('開始', input(40))}${field('結束', input(36))}</div>`);
  assert.equal(flexRow.formMixed.length, 1);
});

test('a centered paragraph of two or more lines is reported; one line, EmptyState and buttons are not', async (t) => {
  if (skip) return t.skip(skip);
  const long = '這是一段很長的說明文字，會在手機寬度上換成好幾行，置中對齊時每一行的起點都不同，很難閱讀。';
  const res = await run(`<p style="text-align:center;width:360px">${long}</p>`, 390);
  assert.equal(res.centered.length, 1);
  const ok = await run(
    `<p style="text-align:center;width:360px">一行就好</p><div class="ui-empty" style="text-align:center"><p style="width:360px">${long}</p></div><button style="text-align:center;width:200px">${long}</button>`,
    390,
  );
  assert.deepEqual(ok.centered, []);
});

test('an AppShell page whose document scrolls is reported', async (t) => {
  if (skip) return t.skip(skip);
  const shell = (pad: number) =>
    `<div style="padding:${pad}px"><div class="ui-shell" style="height:100vh;display:flex"><main style="overflow-y:auto;flex:1"><div style="height:2000px"></div></main></div></div>`;
  assert.match((await run(shell(24))).docScroll, /document \d+ px tall/);
  assert.equal((await run(shell(0))).docScroll, '');
});

test('hand-written buttons, links and text fields are native controls; component ones and Markdown links are not', async (t) => {
  if (skip) return t.skip(skip);
  const res = await run(
    `<button>儲存</button><a href="#x">查看</a><input type="text" aria-label="名稱"><textarea aria-label="備註"></textarea>` +
      `<button class="ui-btn">取消</button><a class="ui-link" href="#y">說明</a><input class="ui-input" aria-label="搜尋">` +
      `<div class="ui-md"><p><a href="#z">文件</a></p></div>`,
  );
  assert.equal(res.native.length, 4);
  assert.match(res.native.join(' '), /Button or IconButton/);
  assert.match(res.native.join(' '), /use Link/);
  assert.match(res.native.join(' '), /use TextField/);
  assert.match(res.native.join(' '), /use TextArea/);
  assert.doesNotMatch(res.native.join(' '), /取消|說明|文件/);
});

test('a field box counts as the control in a toolbar row', async (t) => {
  if (skip) return t.skip(skip);
  const res = await run(
    `<div class="ui-dt-actions" style="display:flex;gap:8px"><div class="ui-field-box" style="height:48px;display:flex"><input class="ui-input" style="height:30px"></div><button class="ui-btn" style="height:40px">篩選</button></div>`,
  );
  assert.equal(res.mixed.length, 1);
  assert.match(res.mixed[0], /48 px/);
});

test('text cut with an ellipsis inside its card is measured by the part that shows', async (t) => {
  if (skip) return t.skip(skip);
  const res = await run(
    `<div class="ui-card" style="width:200px;margin:40px;padding:8px;box-sizing:border-box">
       <p title="說明" style="margin:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${'很長的專案說明文字 '.repeat(8)}</p>
       <div style="overflow:hidden"><span style="display:block;white-space:nowrap">${'一行不換行的路徑 '.repeat(8)}</span></div>
     </div>`,
  );
  assert.deepEqual(res.outside, []);
});

test('a term in a sentence is exempt from the touch checks, also when the text around it is in other elements', async (t) => {
  if (skip) return t.skip(skip);
  const res = await run(
    `<p style="line-height:22px"><span>登入後伺服器會寫一個</span><button class="ui-term is-word" style="display:inline;padding:0;border:0;font:inherit">cookie</button><span>。</span></p>`,
    390,
  );
  assert.deepEqual(res.small, []);
  assert.deepEqual(res.small24, []);
  assert.equal(res.inline.length, 1);
});
