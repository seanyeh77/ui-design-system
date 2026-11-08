import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import * as React from 'react';
import { CodeView, type CodeViewHandle } from '../../index';

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
  expect(lines[1].querySelector('.ui-cv-num')?.getAttribute('aria-hidden')).toBe('true');
  expect(lines[1].getAttribute('aria-current')).toBe('location');
  expect(container.querySelector('pre')?.getAttribute('aria-label')).toBe('程式碼');
  ref.current?.focusTarget();
  expect(document.activeElement).toBe(lines[1]);
});
