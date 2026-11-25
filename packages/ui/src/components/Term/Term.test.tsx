import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Card, Term } from '../../index';

test('Term: the explanation stays inside its card, not over the panel beside it', async () => {
  await page.viewport(1280, 800);
  render(
    <div style={{ display: 'flex', gap: 24, width: 1000, padding: 16 }}>
      <div style={{ width: 400 }}>
        <Card title="呼叫者">
          <p style={{ textAlign: 'right', margin: 0 }}>
            <Term text="呼叫這個函式的函式，一層一層往上列出。">caller</Term>
          </p>
        </Card>
      </div>
      <h3 style={{ margin: 0 }}>程式碼</h3>
    </div>,
  );
  await userEvent.setup().click(screen.getByRole('button', { name: /caller/ }));
  const pop = await waitFor(() => {
    const el = document.querySelector<HTMLElement>('.ui-term-pop');
    if (!el) throw new Error('no explanation');
    return el;
  });
  const card = document.querySelector('.ui-card')?.getBoundingClientRect();
  await waitFor(() => {
    const r = pop.getBoundingClientRect();
    expect(r.right).toBeLessThanOrEqual((card?.right ?? 0) + 0.5);
    expect(r.left).toBeGreaterThanOrEqual((card?.left ?? 0) - 0.5);
  });
});

test('Term inline: read as the word then 「有說明」; focus alone does not open it, Enter does; Esc keeps focus on the word', async () => {
  await page.viewport(1280, 800);
  render(
    <p>
      登入後寫入{' '}
      <Term variant="inline" text="瀏覽器替網站保存的一小段文字。" action={{ label: '看它出現的地方', onClick: () => {} }}>
        cookie
      </Term>
      。
    </p>,
  );
  const word = screen.getByRole('button', { name: /^cookie\s?，有說明$/ });
  expect(word.querySelector('.ui-term-q')).toBeNull();
  const user = userEvent.setup();
  await user.tab();
  expect(document.activeElement).toBe(word);
  // Tabbing past a word does not open its card (nor read it).
  await new Promise((r) => setTimeout(r, 150));
  expect(document.querySelector('.ui-term-pop')).toBeNull();
  expect(word.getAttribute('aria-describedby')).toBeNull();
  await user.keyboard('{Enter}');
  const pop = await waitFor(() => {
    const el = document.querySelector<HTMLElement>('.ui-term-pop');
    if (!el) throw new Error('not open');
    return el;
  });
  expect(word.getAttribute('aria-describedby')).toBe(pop.id);
  // Focus stays on the word when the card opens.
  expect(document.activeElement).toBe(word);
  await user.keyboard('{Escape}');
  await waitFor(() => expect(document.querySelector('.ui-term-pop')).toBeNull());
  expect(document.activeElement).toBe(word);
});

test('Term inline: the pointer resting 500 ms opens it, passing over does not', async () => {
  await page.viewport(1280, 800);
  render(
    <p>
      <Term variant="inline" text="說明。">
        cookie
      </Term>{' '}
      <span>其他</span>
    </p>,
  );
  const user = userEvent.setup();
  const word = screen.getByRole('button', { name: /^cookie\s?，有說明$/ });
  await user.hover(word);
  await new Promise((r) => setTimeout(r, 200));
  expect(document.querySelector('.ui-term-pop')).toBeNull();
  await user.unhover(word);
  await new Promise((r) => setTimeout(r, 500));
  expect(document.querySelector('.ui-term-pop')).toBeNull();
  await user.hover(word);
  await waitFor(() => expect(document.querySelector('.ui-term-pop')).not.toBeNull(), { timeout: 1500 });
});

test('Term inline with openOnFocus: keyboard focus opens the card', async () => {
  await page.viewport(1280, 800);
  render(
    <p>
      寫入{' '}
      <Term variant="inline" openOnFocus text="說明。">
        cookie
      </Term>
    </p>,
  );
  await userEvent.setup().tab();
  await waitFor(() => expect(document.querySelector('.ui-term-pop')).not.toBeNull());
});
