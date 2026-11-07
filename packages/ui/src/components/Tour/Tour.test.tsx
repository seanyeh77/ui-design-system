import { afterEach, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen, waitFor } from '@testing-library/react';
import { Tour } from '../../index';

afterEach(() => page.viewport(1280, 900));

const MARGIN = 12;
const steps = [{ target: 'part', title: '檢查筆記', text: '錯誤的位置附有修正建議，可直接複製。' }];

// The card stays fully inside the window, --space-3 from every edge.
async function cardInside() {
  await screen.findByText('檢查筆記', { selector: '.ui-tour-title' });
  const card = document.querySelector<HTMLElement>('.ui-tour-card');
  if (!card) throw new Error('no .ui-tour-card');
  await waitFor(() => {
    const r = card.getBoundingClientRect();
    expect(r.height).toBeGreaterThan(0);
    expect(r.top).toBeGreaterThanOrEqual(MARGIN - 0.5);
    expect(r.left).toBeGreaterThanOrEqual(MARGIN - 0.5);
    expect(r.bottom).toBeLessThanOrEqual(innerHeight - MARGIN + 0.5);
    expect(r.right).toBeLessThanOrEqual(innerWidth - MARGIN + 0.5);
  });
  return card;
}

test('Tour: a normal target keeps the card below it', async () => {
  render(
    <div>
      <div data-tour="part" style={{ height: 80, margin: 40 }} />
      <Tour open steps={steps} />
    </div>,
  );
  expect((await cardInside()).dataset.placement).toBe('bottom');
});

test('Tour: a target taller than the window puts the card inside it, at the bottom', async () => {
  render(
    <div>
      <div data-tour="part" style={{ height: '150vh', margin: 16 }} />
      <Tour open steps={steps} />
    </div>,
  );
  const card = await cardInside();
  await waitFor(() => expect(card.dataset.placement).toBe('inside'));
  expect(innerHeight - card.getBoundingClientRect().bottom).toBeLessThan(MARGIN + 2);
});

test('Tour: on a phone with long text, the text scrolls and the buttons stay inside the window', async () => {
  await page.viewport(390, 420);
  render(
    <div>
      <div data-tour="part" style={{ height: '150vh' }} />
      <Tour open steps={[{ ...steps[0], text: '錯誤的位置附有修正建議，可直接複製。'.repeat(30) }]} />
    </div>,
  );
  const card = await cardInside();
  const body = card.querySelector<HTMLElement>('.ui-tour-body');
  if (!body) throw new Error('no .ui-tour-body');
  expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
  const done = screen.getByRole('button', { name: '完成' }).getBoundingClientRect();
  expect(done.bottom).toBeLessThanOrEqual(innerHeight - MARGIN + 0.5);
});

test('Tour: a target almost as tall as the window, under a top bar, puts the card inside it', async () => {
  await page.viewport(1280, 800);
  render(
    <div>
      <div style={{ height: 56 }} />
      <div data-tour="part" style={{ height: 690, margin: '0 16px' }} />
      <Tour open steps={steps} />
    </div>,
  );
  const card = await cardInside();
  await waitFor(() => expect(card.dataset.placement).toBe('inside'));
});
