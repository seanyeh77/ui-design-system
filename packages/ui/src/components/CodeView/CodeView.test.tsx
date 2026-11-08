import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { CodeView } from '../../index';

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
  // Copying gives the code back unchanged.
  expect(text.textContent).toBe(code.trimEnd());
});
