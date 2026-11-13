import { expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as React from 'react';
import { CodeView, format, setLocale, type CodeViewHandle } from '../../index';

test('the language reads as a language, not a button', () => {
  const { container } = render(<CodeView file="src/ibmon/child.c" code={'int main(void) {}\n'} />);
  const lang = container.querySelector('.ui-cv-lang');
  expect(lang?.tagName).toBe('SPAN');
  expect(lang?.textContent).toBe('程式語言：C 語言');
  expect(lang?.querySelector('.ui-visually-hidden')?.textContent).toBe('程式語言：');
});

test('a wrapped line never splits an operator, and its continuation is marked', async () => {
  const code = '    return &rd->ring->entries[(rd->ring->head + 1) % rd->ring->capacity]; /* next */\n';
  const { container } = render(
    <div style={{ width: 300 }}>
      <CodeView file="src/libibtrace/ring.c" code={code} />
    </div>,
  );
  const text = container.querySelector<HTMLElement>('.ui-cv-text');
  if (!text) throw new Error('no line');
  // It wraps: more than one 20 px line.
  expect(text.getBoundingClientRect().height).toBeGreaterThan(40);
  const ops = container.querySelectorAll('.ui-cv-op');
  expect([...ops].filter((o) => o.textContent === '->').length).toBe(6);
  for (const op of ops) expect(op.getClientRects().length).toBe(1);
  expect(getComputedStyle(text).backgroundImage).toContain('linear-gradient');
  // Copying gives the code back unchanged: no line number, no 「第 1 行」.
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(text);
  sel?.removeAllRanges();
  sel?.addRange(range);
  expect(sel?.toString()).toBe(code.trimEnd());
  sel?.removeAllRanges();
});

test('each line is its own item for screen readers, and the target line can take focus', () => {
  const ref = React.createRef<CodeViewHandle>();
  const { container } = render(<CodeView ref={ref} file="src/ibmon/main.c" start={62} target={63} code={'pid_t ibmon_spawn(void)\n{\n  return 0;\n}\n'} />);
  const lines = container.querySelectorAll('[role="listitem"]');
  expect(lines.length).toBe(4);
  expect(lines[1].querySelector('.ui-cv-text')?.textContent).toBe('第 63 行：{');
  // a screen reader drops leading spaces: the indentation is said with the line number
  expect(lines[2].querySelector('.ui-cv-sr')?.textContent).toBe('第 64 行，縮排 2 格：');
  expect(lines[1].querySelector('.ui-cv-num')?.getAttribute('aria-hidden')).toBe('true');
  expect(lines[1].getAttribute('aria-current')).toBe('location');
  expect(container.querySelector('pre')?.getAttribute('aria-label')).toBe('程式碼');
  ref.current?.focusTarget();
  expect(document.activeElement).toBe(lines[1]);
});

test('CodeView: English labels use a plain colon', () => {
  setLocale('en');
  try {
    const { container } = render(<CodeView file="src/a.c" code={'a\nb'} start={48} />);
    const sr = [...container.querySelectorAll('.ui-visually-hidden')].map((e) => e.textContent ?? '');
    expect(sr.join('|')).not.toContain('：');
    expect(sr).toContain('Line 48: ');
    const tabbed = render(<CodeView file="src/a.py" code={'if a:\n\tb\n'} start={1} />).container;
    expect([...tabbed.querySelectorAll('.ui-cv-sr')].map((e) => e.textContent)).toEqual(['Line 1: ', 'Line 2, indented 1 tabs: ']);
    expect(sr).toContain('Language: ');
  } finally {
    setLocale('zh-TW');
  }
});

test('format.number follows setLocale, not the browser', () => {
  setLocale('en');
  try {
    expect(format.number(1033)).toBe('1,033');
  } finally {
    setLocale('zh-TW');
  }
  setLocale('de-DE');
  try {
    expect(format.number(1033)).toBe('1.033');
  } finally {
    setLocale('zh-TW');
  }
});

test('CodeView: paths in comments and strings become links with refHref; code and bare names do not', async () => {
  const onRef = vi.fn();
  const code = '/* see docs/design/ring-overrun.md and ring.c:42 */\nint a = b / c; // printf.h\nopen("src/app.c");';
  render(<CodeView file="src/x.c" code={code} refHref={(p) => (p.startsWith('docs/') ? '#' + p : undefined)} />);
  const link = screen.getByRole('link', { name: 'docs/design/ring-overrun.md' });
  expect(link.getAttribute('href')).toBe('#docs/design/ring-overrun.md');
  // refHref returns nothing for these: plain text.
  expect(screen.queryByRole('link', { name: 'ring.c:42' })).toBeNull();
  expect(screen.queryByRole('link', { name: 'src/app.c' })).toBeNull();
  const { container } = render(<CodeView file="src/y.c" code={code} onRef={onRef} />);
  const refs = [...container.querySelectorAll('.ui-cv-ref')].map((e) => e.textContent);
  expect(refs).toEqual(['docs/design/ring-overrun.md', 'ring.c:42', 'src/app.c']);
  await userEvent.setup().click(screen.getByRole('button', { name: 'ring.c:42' }));
  expect(onRef).toHaveBeenCalledWith('ring.c:42', expect.anything());
});

test('CodeView: Home, End, PageUp, PageDown move by line (CA); [ and ] by section, read with its name (CB)', async () => {
  const code = Array.from({ length: 60 }, (_, i) => (i === 9 ? 'def start(self):' : i === 39 ? 'def _run(self, pkt):' : `    x = ${i}`)).join('\n');
  render(
    <CodeView
      code={code}
      file="controller.py"
      sections={[
        { line: 10, label: '函式 start' },
        { line: 40, label: '函式 _run' },
      ]}
    />,
  );
  const user = userEvent.setup();
  const pre = screen.getByLabelText('程式碼');
  expect(pre.getAttribute('aria-keyshortcuts')).toBe('Home End PageUp PageDown [ ]');
  pre.focus();
  const at = () => (document.activeElement instanceof HTMLElement ? document.activeElement.dataset.n : undefined);
  await user.keyboard('{End}');
  expect(at()).toBe('60');
  await user.keyboard('{Home}');
  expect(at()).toBe('1');
  await user.keyboard('{PageDown}');
  expect(at()).toBe('21');
  await user.keyboard('{PageUp}');
  expect(at()).toBe('1');
  await user.keyboard(']');
  expect(at()).toBe('10');
  await user.keyboard(']');
  expect(at()).toBe('40');
  await waitFor(() => expect(document.querySelector('[data-ui-announcer]')?.textContent).toBe('函式 _run，第 40 行'));
  await user.keyboard('[[');
  expect(at()).toBe('10');
});

test('CodeView line numbers (VA): 12 px from the left edge, 16 px before the code', () => {
  const { container } = render(<CodeView code={'int a;\nint b;'} start={70} />);
  const cv = container.querySelector('.ui-cv') as HTMLElement;
  const num = cv.querySelector('.ui-cv-num') as HTMLElement;
  const range = document.createRange();
  range.selectNodeContents(num);
  const digits = range.getBoundingClientRect();
  expect(Math.round(digits.left - cv.getBoundingClientRect().left)).toBe(12);
  const text = cv.querySelector('.ui-cv-text') as HTMLElement;
  expect(Math.round(text.getBoundingClientRect().left - digits.right)).toBe(16);
});

const LAB3 = [
  'def main(argv=None):',
  '    args = parse_args(argv)',
  '    # Deployment steps: harness/runtime.py:591',
  '    emit(runtime.deploy(args.plane))',
  '    rt = runtime',
  '    rt.deploy(args.plane)',
  '    return emit(args)',
].join('\n');

test('links: whole names by col or by the first match; a name that does not match is left out with a warning', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const links = [
      { line: 51, text: 'parse_args', col: 12 },
      { line: 53, text: 'emit', col: 5 },
      { line: 53, text: 'runtime.deploy', label: 'runtime.deploy，定義在 harness/runtime.py:591' },
      // not in the code as a whole name: rt.deploy is not runtime.deploy
      { line: 55, text: 'runtime.deploy' },
      // wrong column
      { line: 56, text: 'emit', col: 3 },
      { line: 99, text: 'emit' },
    ];
    const { container } = render(<CodeView file="harness/lab3.py" code={LAB3} start={50} target={53} links={links} refHref={(p) => '#' + p} />);
    const names = [...container.querySelectorAll<HTMLElement>('.ui-cv-name')];
    expect(names.map((a) => a.textContent)).toEqual(['parse_args', 'emit', 'runtime.deploy']);
    expect(names[2].getAttribute('aria-label')).toBe('runtime.deploy，定義在 harness/runtime.py:591');
    // the whole dotted name is one link, even when the tokenizer splits it
    expect(names[2].closest('[role="listitem"]')?.getAttribute('data-n')).toBe('53');
    // one Tab stop: names and paths are reached with the arrow keys
    for (const a of container.querySelectorAll<HTMLElement>('.ui-cv-name, .ui-cv-ref')) expect(a.tabIndex).toBe(-1);
    const said = warn.mock.calls.map((c) => String(c[0])).join('\n');
    expect(said).toContain('第 55 行找不到完整的「runtime.deploy」');
    expect(said).toContain('第 56 行第 3 欄不是「emit」');
    expect(said).toContain('第 99 行不在程式碼裡');
  } finally {
    warn.mockRestore();
  }
});

test('links: a plain click selects text, Ctrl or ⌘ + click and Enter open the link', async () => {
  const user = userEvent.setup();
  const onLink = vi.fn();
  const links = [{ line: 53, text: 'runtime.deploy', href: '#deploy', id: 'f591' }];
  const { container } = render(<CodeView code={LAB3} start={50} links={links} onLink={onLink} />);
  const a = container.querySelector('.ui-cv-name') as HTMLElement;
  await user.click(a);
  expect(onLink).not.toHaveBeenCalled();
  expect(location.hash).not.toBe('#deploy');
  await user.keyboard('{Control>}');
  await user.click(a);
  await user.keyboard('{/Control}');
  expect(onLink).toHaveBeenCalledTimes(1);
  // the same object that was passed in, with the page's own fields
  expect(onLink.mock.calls[0][0]).toBe(links[0]);
  expect(location.hash).not.toBe('#deploy');
  a.focus();
  await user.keyboard('{Enter}');
  expect(onLink).toHaveBeenCalledTimes(2);
});

test('links: Ctrl or ⌘ held over the code arms the names', async () => {
  const user = userEvent.setup();
  const { container } = render(<CodeView code={LAB3} start={50} links={[{ line: 53, text: 'emit' }]} />);
  const pre = container.querySelector('pre') as HTMLElement;
  await user.hover(pre);
  await user.keyboard('{Control>}');
  expect(pre.classList.contains('is-armed')).toBe(true);
  await user.keyboard('{/Control}');
  expect(pre.classList.contains('is-armed')).toBe(false);
});

test('links: ↑ ↓ move by line, ← → between links, Esc back to the line and then to the code', async () => {
  const user = userEvent.setup();
  const links = [
    { line: 51, text: 'parse_args' },
    { line: 53, text: 'emit' },
    { line: 53, text: 'runtime.deploy' },
  ];
  const { container } = render(<CodeView file="harness/lab3.py" code={LAB3} start={50} target={53} links={links} refHref={(p) => '#' + p} />);
  const pre = container.querySelector('pre') as HTMLElement;
  const line = (n: number) => container.querySelector(`[data-n="${n}"]`);
  pre.focus();
  await user.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(line(53));
  await user.keyboard('{ArrowUp}');
  expect(document.activeElement).toBe(line(52));
  // the path in the comment is a stop too
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement?.textContent).toBe('harness/runtime.py:591');
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement?.textContent).toBe('emit');
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement?.textContent).toBe('runtime.deploy');
  // the last link stays put
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement?.textContent).toBe('runtime.deploy');
  await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
  expect(document.activeElement?.textContent).toBe('parse_args');
  await user.keyboard('{Escape}');
  expect(document.activeElement).toBe(line(51));
  await user.keyboard('{Escape}');
  expect(document.activeElement).toBe(pre);
  // one Tab stop: the next Tab leaves the code
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement?.textContent).toBe('emit');
  expect(pre.getAttribute('aria-keyshortcuts')).toContain('ArrowLeft');
});

test('links: without links the arrow keys still scroll, as before', async () => {
  const user = userEvent.setup();
  const { container } = render(<CodeView code={LAB3} start={50} target={53} />);
  const pre = container.querySelector('pre') as HTMLElement;
  pre.focus();
  await user.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(pre);
  expect(pre.getAttribute('aria-keyshortcuts')).not.toContain('ArrowLeft');
});

test('links: the preview shows after 500 ms of keyboard focus, and Esc closes it', async () => {
  const user = userEvent.setup();
  const links = [{ line: 53, text: 'runtime.deploy' }];
  const { container } = render(<CodeView code={LAB3} start={50} target={53} links={links} preview={(l) => <span>預覽 {l.text}</span>} />);
  (container.querySelector('pre') as HTMLElement).focus();
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement?.textContent).toBe('runtime.deploy');
  expect(screen.queryByText('預覽 runtime.deploy')).toBeNull();
  await waitFor(() => expect(screen.getByText('預覽 runtime.deploy')).toBeTruthy(), { timeout: 1500 });
  const card = screen.getByText('預覽 runtime.deploy').closest('.ui-cv-preview') as HTMLElement;
  expect(document.activeElement?.getAttribute('aria-describedby')).toBe(card.id);
  // no native tooltip next to the card
  expect(document.activeElement?.hasAttribute('title')).toBe(false);
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByText('預覽 runtime.deploy')).toBeNull());
  expect(document.activeElement?.textContent).toBe('runtime.deploy');
});

test('links: a name split by wrapping stays one link', () => {
  const code = '        ctl.attach(router, priority=Oracle.flow_priority_for_the_router(router, args.plane, default=DEFAULT_PRIORITY))';
  const { container } = render(
    <div style={{ width: 300 }}>
      <CodeView code={code} links={[{ line: 1, text: 'Oracle.flow_priority_for_the_router' }]} />
    </div>,
  );
  const a = container.querySelectorAll('.ui-cv-name');
  expect(a.length).toBe(1);
  expect(a[0].textContent).toBe('Oracle.flow_priority_for_the_router');
  expect(getComputedStyle(a[0]).textDecorationStyle).toBe('dotted');
});
