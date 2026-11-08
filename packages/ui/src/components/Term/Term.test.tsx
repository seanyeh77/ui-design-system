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
