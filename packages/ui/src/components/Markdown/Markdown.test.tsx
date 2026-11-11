import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen } from '@testing-library/react';
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
  expect(Math.round(head.getBoundingClientRect().height)).toBe(32);
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
