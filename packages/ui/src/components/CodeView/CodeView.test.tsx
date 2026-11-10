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
