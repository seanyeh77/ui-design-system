import { afterEach, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { InlineCode } from '../../index';

// The browser resolves any CSS color (color-mix included) to sRGB through a canvas.
function rgb(css: string): [number, number, number] {
  const c = document.createElement('canvas').getContext('2d');
  if (!c) throw new Error('no canvas');
  c.fillStyle = css;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}
const lum = ([r, g, b]: number[]) => {
  const f = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

afterEach(() => document.documentElement.removeAttribute('data-theme'));

test.each(['light', 'dark'])('a code link reaches 4.5:1 on its chip (%s)', (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  const { container } = render(<InlineCode href="#x">child.c:86</InlineCode>);
  const el = container.querySelector('.ui-code');
  if (!el) throw new Error('no link');
  const cs = getComputedStyle(el);
  expect(contrast(cs.color, cs.backgroundColor)).toBeGreaterThanOrEqual(4.5);
});
