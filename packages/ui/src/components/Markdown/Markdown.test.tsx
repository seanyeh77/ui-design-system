import { expect, test, vi } from 'vitest';
import { cdp, page } from 'vitest/browser';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Markdown } from '../../index';

const doc = `# 執行方式

先跑 \`make\`，再用 **harness/run.sh** 啟動，*不要*直接改 snake_case_name。
見 \`harness/routing.py:108\` 與 [評分](docs/grading.md)，或 <https://example.com>。

<details>評分細節</details><script>alert(1)</script>

- 第一項
- 第二項
  1. 子項目
  2. 子項目二

> 引用的一句

---

\`\`\`python
def flow_priority(flow, link):
    return 7
\`\`\`

| 測資 | 筆數 |
|---|---|
| small | 12 |
| large | 480 |
`;

test('Markdown: blocks, demoted headings, inline syntax; no HTML runs', async () => {
  await page.viewport(1280, 800);
  const { container } = render(<Markdown>{doc}</Markdown>);
  expect(screen.getByRole('heading', { level: 4, name: '執行方式' })).toBeTruthy();
  expect(container.querySelector('strong')?.textContent).toBe('harness/run.sh');
  expect(container.querySelector('em')?.textContent).toBe('不要');
  expect(container.textContent).toContain('snake_case_name');
  expect(container.querySelector('code.ui-code')?.textContent).toBe('make');
  expect(container.querySelector('script')).toBeNull();
  expect(container.querySelector('details')).toBeNull();
  expect(container.textContent).toContain('評分細節');
  expect(container.textContent).not.toContain('<details>');
  expect(container.querySelectorAll('ul > li').length).toBe(2);
  expect(container.querySelectorAll('ul > li ol > li').length).toBe(2);
  expect(container.querySelector('blockquote')?.textContent).toBe('引用的一句');
  expect(container.querySelector('hr')).not.toBeNull();
  expect(container.querySelector('.ui-cv')?.textContent).toContain('def flow_priority');
  // ```python is colored as py and labelled Python.
  expect(container.querySelector('.ui-cv .is-keyword')?.textContent).toBe('def');
  expect(container.querySelector('.ui-cv-lang')?.textContent).toContain('Python');
  const cells = [...container.querySelectorAll('td')];
  expect(cells.map((c) => c.textContent)).toEqual(['small', '12', 'large', '480']);
  expect(getComputedStyle(cells[1]).textAlign).toBe('right');
  expect(container.querySelector('th')?.textContent).toBe('測資');
  expect(screen.getByRole('link', { name: 'https://example.com' }).getAttribute('href')).toBe('https://example.com');
});

test('Markdown: only http, https, mailto and relative links; javascript: is text', () => {
  const { container } = render(<Markdown>{'[a](javascript:alert(1)) [b](data:text/html,x) [c](mailto:a@b.c) [d](../x.md)'}</Markdown>);
  expect(container.querySelectorAll('a').length).toBe(2);
  expect(screen.getByRole('link', { name: 'c' }).getAttribute('href')).toBe('mailto:a@b.c');
  expect(screen.getByRole('link', { name: 'd' }).getAttribute('href')).toBe('../x.md');
  expect(container.textContent).toBe('a b c d');
});

test('Markdown: linkHref, onLink, and paths in inline code go through refHref and onRef', async () => {
  const user = userEvent.setup();
  const links: string[] = [];
  const refs: string[] = [];
  render(
    <Markdown linkHref={(h) => '#open=' + h} onLink={(h) => links.push(h)} refHref={(r) => '#ref=' + r} onRef={(r) => refs.push(r)}>
      {'見 `harness/routing.py:108` 與 [評分](docs/grading.md)，`make` 不是路徑。'}
    </Markdown>,
  );
  const ref = screen.getByRole('link', { name: 'harness/routing.py:108' });
  expect(ref.getAttribute('href')).toBe('#ref=harness/routing.py:108');
  await user.click(ref);
  expect(refs).toEqual(['harness/routing.py:108']);
  const link = screen.getByRole('link', { name: '評分' });
  expect(link.getAttribute('href')).toBe('#open=docs/grading.md');
  await user.click(link);
  expect(links).toEqual(['docs/grading.md']);
  expect(screen.queryByRole('link', { name: 'make' })).toBeNull();
});

test('Markdown inline: one line, no paragraphs; size small', () => {
  const { container } = render(
    <Markdown inline size="small">
      {'先跑 `make`，\n再用 **run.sh** 啟動。\n\n第二段'}
    </Markdown>,
  );
  const root = container.firstElementChild as HTMLElement;
  expect(root.tagName).toBe('SPAN');
  expect(root.querySelector('p')).toBeNull();
  expect(root.textContent).toBe('先跑 make，再用 run.sh 啟動。第二段');
  expect(getComputedStyle(root).fontSize).toBe('13px');
});

test('Markdown: code blocks have a small copy icon that copies the code', async () => {
  const copied: string[] = [];
  const { container } = render(<Markdown>{'```sh\nmake test\n```'}</Markdown>);
  const btn = screen.getByRole('button', { name: '複製程式碼' });
  expect(btn.querySelector('svg')).not.toBeNull();
  expect(btn.textContent).toBe('');
  container.addEventListener('copy', () => copied.push('event'));
  await userEvent.setup().click(btn);
  await screen.findByRole('button', { name: '已複製' });
});

test('Markdown code blocks (KB): a 32 px header with no rule, no line numbers, code 16 px in; CodeView numbers 12 px in (VA)', async () => {
  await page.viewport(1280, 800);
  const { container } = render(<Markdown>{'```sh\nmake test\n```'}</Markdown>);
  const cv = container.querySelector('.ui-cv') as HTMLElement;
  const head = cv.querySelector('.ui-cv-head') as HTMLElement;
  expect(Math.abs(head.getBoundingClientRect().height - 32)).toBeLessThanOrEqual(1);
  expect(getComputedStyle(head).borderBottomWidth).toBe('0px');
  expect(cv.querySelector('.ui-cv-num')).toBeNull();
  expect(cv.querySelector('[role="listitem"]')?.textContent).toContain('第 1 行');
  const text = cv.querySelector('.ui-cv-text') as HTMLElement;
  expect(Math.round(text.getBoundingClientRect().left - cv.getBoundingClientRect().left)).toBe(16);
});

const overview = `### harness/controller.py（可修改）

| 指令 | 位置 | namespace | 逾時 |
|---|---|---|---|
| \`ip netns exec l3-r{as_id} ip -j route\` | [\`_sync_as\`](fn:harness/controller.py:VirtualRouter._sync_as) \`harness/controller.py:540\` | l3-r{as_id} | 5 秒 |
| \`osken-manager --ofp-tcp-listen-port 6653 …\` | \`harness/runtime.py:421\` | 呼叫者的 namespace | 沒有 |

<details open onclick="alert(1)"><summary>另有 49 處呼叫</summary>

| 指令 | 位置 |
|---|---|
| \`ovs-vsctl show\` | \`harness/runtime.py:88\` |

</details>

之後的段落 <b>粗</b>。`;

test('Markdown details (DA): a closed block with a button; attributes dropped; other HTML still dropped; find opens it', async () => {
  const { container } = render(<Markdown topLevel={2}>{overview}</Markdown>);
  expect(screen.getByRole('heading', { level: 4, name: 'harness/controller.py（可修改）' })).toBeTruthy();
  const btn = screen.getByRole('button', { name: '另有 49 處呼叫' });
  expect(btn.getAttribute('aria-expanded')).toBe('false');
  const body = document.getElementById(btn.getAttribute('aria-controls') ?? '') as HTMLElement;
  expect(body.getAttribute('hidden')).toBe('until-found');
  expect(body.textContent).toContain('ovs-vsctl show');
  expect(container.querySelector('details, b, [onclick]')).toBeNull();
  expect(container.textContent).toContain('之後的段落 粗');
  await userEvent.setup().click(btn);
  expect(btn.getAttribute('aria-expanded')).toBe('true');
  expect(body.hasAttribute('hidden')).toBe(false);
  await userEvent.setup().click(btn);
  body.dispatchEvent(new Event('beforematch'));
  await screen.findByRole('button', { name: '另有 49 處呼叫', expanded: true });
});

test('Markdown schemes: fn: goes to linkHref and onLink as written; never javascript:, data:, vbscript:', async () => {
  const seen: string[] = [];
  const src = '[a](fn:x.py:f) [b](javascript:alert(1)) [c](vbscript:x) [d](data:text/html,x)';
  const { container, unmount } = render(<Markdown>{src}</Markdown>);
  expect(container.querySelectorAll('a, button').length).toBe(0);
  unmount();
  render(
    <Markdown
      schemes={['fn', 'javascript', 'data', 'vbscript']}
      linkHref={(h) => (h.startsWith('fn:') ? '#flow=' + h.slice(3) : h)}
      onLink={(h) => seen.push(h)}
    >
      {src}
    </Markdown>,
  );
  const a = screen.getByRole('link', { name: 'a' });
  expect(a.getAttribute('href')).toBe('#flow=x.py:f');
  expect(screen.queryByRole('link', { name: 'b' })).toBeNull();
  expect(screen.queryByRole('link', { name: 'c' })).toBeNull();
  expect(screen.queryByRole('link', { name: 'd' })).toBeNull();
  await userEvent.setup().click(a);
  expect(seen).toEqual(['fn:x.py:f']);
});

test('Markdown alerts (NB): > [!WARNING] is an Alert; a plain > stays a quote', () => {
  const { container } = render(<Markdown>{'> 僅列出程式碼中的事實。\n\n> [!WARNING]\n> 沒有逾時的指令卡住時，整個實驗會一起停住。'}</Markdown>);
  expect(container.querySelector('blockquote')?.textContent).toBe('僅列出程式碼中的事實。');
  const alert = container.querySelector('.ui-alert.ui-alert-warning') as HTMLElement;
  expect(alert.textContent).toContain('沒有逾時的指令卡住時');
  expect(alert.textContent).not.toContain('[!WARNING]');
});

test('Markdown tables (TB): code wraps inside cells; under 480 px each row is a card with the column names', async () => {
  await page.viewport(1280, 800);
  const { container, rerender } = render(
    <div style={{ width: 620 }}>
      <Markdown>{overview}</Markdown>
    </div>,
  );
  const td = container.querySelector('td') as HTMLElement;
  expect(getComputedStyle(td).display).toBe('table-cell');
  const code = td.querySelector('.ui-code') as HTMLElement;
  expect(code.getBoundingClientRect().right).toBeLessThanOrEqual(td.getBoundingClientRect().right + 1);
  const wrap = container.querySelector('.ui-md-table-wrap') as HTMLElement;
  expect(wrap.tabIndex).toBe(0);
  expect(wrap.getAttribute('aria-label')).toBe('指令、位置、namespace、逾時');
  expect((container.firstElementChild as HTMLElement).scrollWidth).toBeLessThanOrEqual(620);
  rerender(
    <div style={{ width: 400 }}>
      <Markdown>{overview}</Markdown>
    </div>,
  );
  expect(getComputedStyle(td).display).toBe('block');
  expect(getComputedStyle(td, '::before').content).toBe('"指令"');
  expect(wrap.scrollWidth).toBeLessThanOrEqual(wrap.clientWidth);
});

test('Markdown alerts: no space left under the last line', () => {
  const { container } = render(<Markdown>{'> [!NOTE]\n> 一行。'}</Markdown>);
  const p = container.querySelector('.ui-alert-body p') as HTMLElement;
  expect(getComputedStyle(p).marginBottom).toBe('0px');
});

test('Markdown tables: names, paths and words stay whole; only spaces and CJK break lines', async () => {
  await page.viewport(1280, 900);
  const src = [
    '| 函式 | 指令 | 位置 | network namespace | 執行方式 |',
    '|---|---|---|---|---|',
    '| [_run](fn:a)（包裝函式） | `ip netns exec {namespace} {argv}` | `harness/controller.py:91` | 依呼叫處 | subprocess.run，逾時 timeout |',
    "| [VirtualRouter._probe_neighbor](fn:b) | `ip netns exec l3-r{as_id} ping {'-6' if family == 6 else '-4'} -n -c 1 -W 1 -I {device} {gateway}` | `harness/controller.py:684` | l3-r{as_id} | subprocess.Popen，沒有逾時 |",
  ].join('\n');
  render(
    <div style={{ width: 860 }}>
      <Markdown schemes={['fn']} linkHref={(h) => '#' + h} refHref={(r) => '#' + r}>
        {src}
      </Markdown>
    </div>,
  );
  // One line: every box of the link on the same line (a location is two spans, so it can have two boxes side by side).
  const oneLine = (el: Element) => new Set([...el.getClientRects()].map((r) => Math.round(r.top))).size === 1;
  expect(oneLine(screen.getByRole('link', { name: 'VirtualRouter._probe_neighbor' }))).toBe(true);
  expect(oneLine(screen.getByRole('link', { name: 'harness/controller.py:684' }))).toBe(true);
  const word = [...document.querySelectorAll('td')].find((t) => t.textContent?.startsWith('subprocess.Popen')) as HTMLElement;
  const range = document.createRange();
  const text = word.firstChild as Text;
  range.setStart(text, 0);
  range.setEnd(text, 'subprocess.Popen'.length);
  expect(range.getClientRects().length).toBe(1);
});

const wide = ['| 函式 | 指令 | 位置 |', '|---|---|---|', '| [_run](fn:a) | `ip netns exec {namespace} {argv}` | `harness/controller.py:91` |'].join('\n');

test('Markdown tables (TA): a column border drags with ← →; Enter goes back to widths by content', async () => {
  await page.viewport(1280, 900);
  const user = userEvent.setup();
  render(
    <div style={{ width: 860 }}>
      <Markdown refHref={(r) => '#' + r}>{wide}</Markdown>
    </div>,
  );
  const th = screen.getByRole('columnheader', { name: /指令/ });
  const w0 = th.getBoundingClientRect().width;
  const handle = screen.getByRole('separator', { name: '調整「指令」欄寬' });
  expect(handle.getAttribute('aria-orientation')).toBe('vertical');
  handle.focus();
  await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
  expect(Math.abs(th.getBoundingClientRect().width - (w0 + 48))).toBeLessThanOrEqual(1);
  expect(Math.abs(Number(handle.getAttribute('aria-valuenow')) - (w0 + 48))).toBeLessThanOrEqual(1);
  await user.keyboard('{Enter}');
  expect(Math.abs(th.getBoundingClientRect().width - w0)).toBeLessThanOrEqual(1);
});

test('Markdown tables (TB): the corner button shows the whole table in a wide dialog; hidden when rows are cards', async () => {
  await page.viewport(1280, 900);
  const user = userEvent.setup();
  const { rerender } = render(
    <div style={{ width: 620 }}>
      <Markdown>{wide}</Markdown>
    </div>,
  );
  await user.click(screen.getByRole('button', { name: '放大表格' }));
  const dialog = await screen.findByRole('dialog', { name: '表格' });
  expect(dialog.querySelector('table')?.textContent).toContain('harness/controller.py:91');
  expect(dialog.getBoundingClientRect().width).toBeGreaterThan(1000);
  await user.keyboard('{Escape}');
  rerender(
    <div style={{ width: 400 }}>
      <Markdown>{wide}</Markdown>
    </div>,
  );
  const big = screen.getByRole('button', { name: '放大表格', hidden: true });
  expect(getComputedStyle(big.parentElement as HTMLElement).display).toBe('none');
});

test('Markdown tables (TA): after a drag the other columns keep their words whole', async () => {
  await page.viewport(1280, 900);
  render(
    <div style={{ width: 860 }}>
      <Markdown>{'| 函式 | 指令 |\n|---|---|\n| [VirtualRouter._probe_neighbor](a.md) | `ip netns exec {namespace} {argv}` |'}</Markdown>
    </div>,
  );
  const link = screen.getByRole('link', { name: 'VirtualRouter._probe_neighbor' });
  expect(link.getClientRects().length).toBe(1);
  screen.getByRole('separator', { name: '調整「指令」欄寬' }).focus();
  await userEvent.setup().keyboard('{ArrowRight}');
  expect(link.getClientRects().length).toBe(1);
});

test('Markdown tables: a link clicked in the 「放大表格」 dialog closes it, as in DataTable', async () => {
  await page.viewport(1280, 900);
  const user = userEvent.setup();
  const seen: string[] = [];
  render(<Markdown onRef={(r) => seen.push(r)}>{'| 位置 |\n|---|\n| `harness/controller.py:540` |'}</Markdown>);
  await user.click(screen.getByRole('button', { name: '放大表格' }));
  const dialog = await screen.findByRole('dialog', { name: '表格' });
  await user.click(dialog.querySelector('.ui-code') as HTMLElement);
  expect(seen).toEqual(['harness/controller.py:540']);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

test('Markdown: a link of one code span is a name, a file:line reference is a location, other links stay', () => {
  const md = '[`VirtualRouter._sync_as`](fn:harness/controller.py:VirtualRouter._sync_as) `harness/controller.py:540`，見 [說明](fn:docs) 與 `IBTRACE_SHM`。';
  const opened: string[] = [];
  const { container } = render(
    <Markdown schemes={['fn']} onLink={(h) => opened.push(h)} refHref={(r) => '#' + r}>
      {md}
    </Markdown>,
  );
  const name = container.querySelector<HTMLElement>('.ui-code.is-name');
  expect(name?.textContent).toBe('VirtualRouter._sync_as');
  expect(name?.closest('.ui-md-link')).toBeNull();
  expect(container.querySelector('.ui-code.is-location')?.textContent).toBe('harness/controller.py:540');
  expect(container.querySelector('.ui-md-link')?.textContent).toBe('說明');
  // A code span that points nowhere keeps the chip.
  const env = Array.from(container.querySelectorAll('code.ui-code')).find((e) => e.textContent === 'IBTRACE_SHM');
  expect(env?.className).not.toMatch(/is-(name|location)/);
  name?.click();
  expect(opened).toEqual(['fn:harness/controller.py:VirtualRouter._sync_as']);
});

test('Markdown: [AI](ai:) is a mark at the end, not a link and not a Tab stop', async () => {
  const { container } = render(
    <Markdown>{'[AI](ai:) 這個函式在路由表變動時重新建立連線。\n\n- 清單項目也可以。 [AI](ai:)\n- 寫在結尾也可以 [推測](ai:)'}</Markdown>,
  );
  const marks = container.querySelectorAll('.ui-aimark');
  expect(marks.length).toBe(3);
  expect([...marks].map((m) => m.textContent)).toEqual(['AI 撰寫', 'AI 撰寫', '推測']);
  expect(container.querySelector('a, button')).toBeNull();
  expect(marks[0].getAttribute('aria-hidden')).toBe('true');
  const p = container.querySelector('p');
  expect(p?.textContent).toBe('這個函式在路由表變動時重新建立連線。AI 撰寫（AI 撰寫）');
  expect(p?.lastElementChild?.previousElementSibling?.className).toBe('ui-aimark');
  await userEvent.tab();
  expect(document.activeElement).toBe(document.body);
});

test('terms: first per block in plain text; not in headings, links or inline code; term: marks explicitly', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const terms = [
    { term: 'cookie', text: '瀏覽器保存的一小段文字。' },
    { term: 'session', title: '工作階段', text: '伺服器記住同一位使用者的一段期間。' },
  ];
  const src = [
    '# cookie',
    '',
    '登入後寫入cookie，之後每次都帶上 cookie；cookies 不算，`cookie` 也不算，[cookie](https://example.com) 也不算。',
    '',
    '- 第二個 cookie',
    '- [工作階段](term:session) 過期要重新登入',
    '- [沒有](term:nope)',
  ].join('\n');
  const { container } = render(<Markdown terms={terms}>{src}</Markdown>);
  const marks = [...container.querySelectorAll('.ui-term.is-word')];
  expect(marks.map((m) => m.firstChild?.textContent)).toEqual(['cookie', 'cookie', '工作階段']);
  expect(container.querySelector('h4 .ui-term')).toBeNull();
  // The Chinese characters beside it do not stop the match.
  expect(marks[0].closest('p')).not.toBeNull();
  expect(container.textContent).toContain('沒有');
  expect(warn.mock.calls.some((c) => String(c.join(' ')).includes('term:nope'))).toBe(true);
  warn.mockRestore();
});

test('terms: termsMark="all" marks every time', () => {
  const { container } = render(
    <Markdown terms={[{ term: 'cookie', text: '說明。' }]} termsMark="all">
      {'cookie 和 cookie'}
    </Markdown>,
  );
  expect(container.querySelectorAll('.ui-term.is-word').length).toBe(2);
});

const refs = `- [RFC 1812: Requirements for IP Version 4 Routers](https://www.rfc-editor.org/rfc/rfc1812)
- [論文](docs/paper.md)
- 見 [評分](docs/grading.md) 的說明
- [schemes](fn:a.py:f)
`;

test('Markdown: a list item that is one link is a row link; a link in a sentence stays inline', async () => {
  await page.viewport(390, 844);
  const { container } = render(
    <div style={{ width: 360 }}>
      <Markdown schemes={['fn']} onLink={() => {}}>
        {refs}
      </Markdown>
    </div>,
  );
  const items = [...container.querySelectorAll('li')];
  expect(items.map((li) => li.className)).toEqual(['ui-md-rowitem', 'ui-md-rowitem', '', 'ui-md-rowitem']);
  const rfc = items[0].firstElementChild as HTMLElement;
  expect(rfc.tagName).toBe('A');
  expect(rfc.className).toBe('ui-md-link is-row');
  expect(items[0].childNodes.length).toBe(1);
  // A scheme of the app's own without an address is a button; it fills the row too.
  expect(items[3].firstElementChild?.tagName).toBe('BUTTON');
  expect(items[3].firstElementChild?.className).toBe('ui-md-link is-row');
  expect(items[2].querySelector('a')?.className).toBe('ui-md-link');
  // The row fills the item (6 px more to the left for the hover ground), text left-aligned; 32 px with a mouse.
  for (const li of [items[0], items[3]]) {
    const row = (li.firstElementChild as HTMLElement).getBoundingClientRect();
    const box = li.getBoundingClientRect();
    expect(Math.round(row.right)).toBe(Math.round(box.right));
    expect(Math.round(box.left - row.left)).toBe(6);
  }
  expect(getComputedStyle(rfc).textAlign).toBe('left');
  expect(Math.round((items[1].firstElementChild as HTMLElement).getBoundingClientRect().height)).toBe(32);
  // The long title wraps inside the row instead of overflowing it.
  expect(rfc.getBoundingClientRect().height).toBeGreaterThan(32);
  await page.viewport(414, 896);
});

test('Markdown: on a touch screen a row link is at least 48 px tall', async () => {
  await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: 'coarse' }] });
  try {
    expect(matchMedia('(pointer: coarse)').matches).toBe(true);
    const { container } = render(<Markdown>{'- [論文](docs/paper.md)\n- [規格](docs/spec.md)'}</Markdown>);
    const rows = container.querySelectorAll('a.is-row');
    expect(rows).toHaveLength(2);
    for (const a of rows) expect(a.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
  } finally {
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
  }
});
