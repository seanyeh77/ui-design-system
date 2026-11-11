import { expect, test } from 'vitest';
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

test('Markdown: blocks, demoted headings, inline syntax; no HTML runs', () => {
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
