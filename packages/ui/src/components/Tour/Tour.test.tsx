import { afterEach, expect, test, vi } from 'vitest';
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

// A phone page with a fixed top bar and bottom tab bar, as AppShell draws them.
function PhonePage({ h, above = 140 }: { h: number; above?: number }) {
  return (
    <div>
      <div className="ui-shell-top" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: 'var(--surface)', zIndex: 5 }} />
      <div style={{ paddingTop: 72 }}>
        <div style={{ height: above, margin: '0 16px 16px' }} />
        <div data-tour="part" style={{ height: h, margin: '0 16px 16px' }} />
        <div style={{ height: 900 }} />
      </div>
      <nav className="ui-tabbar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} />
      <Tour open steps={steps} />
    </div>
  );
}
const box = (q: string) => {
  const el = document.querySelector(q);
  if (!el) throw new Error('no ' + q);
  return el.getBoundingClientRect();
};

test('Tour on a phone: the target scrolls under the top bar and the card sits below it, above the tab bar', async () => {
  await page.viewport(390, 700);
  render(<PhonePage h={300} />);
  const card = await cardInside();
  await waitFor(() => {
    const t = box('[data-tour="part"]');
    const c = card.getBoundingClientRect();
    expect(t.top).toBeGreaterThanOrEqual(56);
    expect(t.top).toBeLessThan(56 + 40);
    expect(c.top).toBeGreaterThanOrEqual(t.bottom);
    expect(c.bottom).toBeLessThanOrEqual(box('.ui-tabbar').top - MARGIN + 0.5);
  });
  expect(card.dataset.placement).toBe('bottom');
  window.scrollTo(0, 0);
});

test('Tour on a phone: a target too tall for the card below it scrolls down to make room; the card sits above it, covering none of it', async () => {
  await page.viewport(390, 700);
  // Enough page above the target for the card to fit there once scrolled.
  render(<PhonePage h={520} above={300} />);
  const card = await cardInside();
  await waitFor(() => {
    const c = card.getBoundingClientRect();
    expect(card.dataset.placement).toBe('top');
    expect(c.top).toBeGreaterThanOrEqual(56);
    expect(c.bottom).toBeLessThanOrEqual(box('[data-tour="part"]').top);
  });
  window.scrollTo(0, 0);
});

test('Tour: a tall table with room to scroll gets the card above it, not over it', async () => {
  await page.viewport(1280, 700);
  render(
    <div>
      <div style={{ height: 400 }} />
      <div data-tour="part" style={{ height: 900, margin: '0 16px' }} />
      <div style={{ height: 400 }} />
      <Tour open steps={steps} />
    </div>,
  );
  const card = await cardInside();
  await waitFor(() => {
    const c = card.getBoundingClientRect();
    const t = box('[data-tour="part"]');
    expect(card.dataset.placement).toBe('top');
    expect(c.top).toBeGreaterThanOrEqual(0);
    expect(c.bottom).toBeLessThanOrEqual(t.top);
  });
  window.scrollTo(0, 0);
});

test('Tour: a tall target that cannot scroll, with room beside it, gets the card beside it', async () => {
  await page.viewport(1280, 700);
  render(
    <div>
      <div data-tour="part" style={{ height: 690, width: 600, margin: '0 16px' }} />
      <Tour open steps={steps} />
    </div>,
  );
  const card = await cardInside();
  await waitFor(() => {
    const c = card.getBoundingClientRect();
    expect(card.dataset.placement).toBe('right');
    expect(c.left).toBeGreaterThanOrEqual(box('[data-tour="part"]').right);
  });
});

test('Tour: a target below the fold scrolls fully into view', async () => {
  await page.viewport(1280, 700);
  render(
    <div>
      <div style={{ height: 1500 }} />
      <div data-tour="part" style={{ height: 100 }} />
      <div style={{ height: 1500 }} />
      <Tour open steps={steps} />
    </div>,
  );
  await cardInside();
  await waitFor(() => {
    const r = box('[data-tour="part"]');
    expect(r.top).toBeGreaterThanOrEqual(0);
    expect(r.bottom).toBeLessThanOrEqual(innerHeight);
  });
  window.scrollTo(0, 0);
});

test('Tour: the step count is shown 「1 / 2」 but its text is only 「第 1 步，共 2 步」', async () => {
  render(
    <>
      <div data-tour="a" style={{ width: 100, height: 40 }} />
      <Tour
        open
        steps={[
          { target: 'a', title: 'A', text: 'a' },
          { target: 'a', title: 'B', text: 'b' },
        ]}
        onClose={() => {}}
      />
    </>,
  );
  const count = await waitFor(() => {
    const el = document.querySelector('.ui-tour-count');
    if (!el) throw new Error('no count');
    return el;
  });
  expect(count.textContent).toBe('第 1 步，共 2 步');
  const seen = [...count.querySelectorAll('.ui-seen')].map((e) => getComputedStyle(e, '::before').content.replace(/"|\s*\/\s*""/g, ''));
  expect(seen.join('')).toBe('1 / 2');
});

test('Tour: warns in development when a target is taller than most of the window', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(
    <>
      <div data-tour="page" style={{ height: '200vh' }} />
      <Tour open steps={[{ target: 'page', title: '整頁', text: 'x' }]} onClose={() => {}} />
    </>,
  );
  await waitFor(() => expect(warn.mock.calls.some((c) => String(c[0]).includes('比視窗的 70% 高'))).toBe(true));
  warn.mockRestore();
});
