import { afterEach, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from './components/Button/Button';

// The system's CSS sits in @layer ui (tokens in ui.tokens, components in ui.components), so a page's own CSS overrides
// it without matching its specificity: unlayered CSS always wins, and so does a layer after ui (Tailwind's utilities).

const added: HTMLStyleElement[] = [];
const addCss = (css: string) => {
  const el = document.createElement('style');
  el.textContent = css;
  document.head.append(el);
  added.push(el);
};
afterEach(() => {
  for (const el of added.splice(0)) el.remove();
});
const bg = (el: Element) => getComputedStyle(el).backgroundColor;
// The button fades its background on a change; the test reads the end value at once.
const button = (getByRole: (role: 'button') => HTMLElement) => {
  const btn = getByRole('button');
  btn.style.transition = 'none';
  return btn;
};

test('unlayered page CSS overrides a component, even with a lower specificity', () => {
  const { getByRole } = render(<Button variant="primary">儲存</Button>);
  const btn = button(getByRole);
  const before = bg(btn);
  // :where() has specificity 0; .ui-btn-primary has 0,1,0 and would win if the component CSS were unlayered.
  addCss(':where(.ui-btn) { background: rgb(1, 2, 3); }');
  expect(bg(btn)).toBe('rgb(1, 2, 3)');
  expect(before).not.toBe('rgb(1, 2, 3)');
});

test("Tailwind's layers: utilities override a component, base (preflight) does not", () => {
  const { getByRole } = render(<Button variant="primary">儲存</Button>);
  const btn = button(getByRole);
  const own = bg(btn);
  addCss('@layer base { button { background: rgb(9, 9, 9); } }');
  expect(bg(btn)).toBe(own);
  addCss('@layer utilities { .bg-test { background: rgb(4, 5, 6); } }');
  btn.classList.add('bg-test');
  expect(bg(btn)).toBe('rgb(4, 5, 6)');
});

test("unlayered :root variables override the tokens, whatever the theme's selector", () => {
  document.documentElement.setAttribute('data-theme', 'dark');
  try {
    addCss(':root { --surface: rgb(7, 8, 9); }');
    expect(getComputedStyle(document.documentElement).getPropertyValue('--surface').trim()).toBe('rgb(7, 8, 9)');
  } finally {
    document.documentElement.removeAttribute('data-theme');
  }
});
