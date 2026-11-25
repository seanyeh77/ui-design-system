import { afterEach, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { CodeText, InlineCode } from '../../index';

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

test.each(['light', 'dark'])('a name and a location reach 4.5:1 on the page and on a table row (%s)', (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  const root = getComputedStyle(document.documentElement);
  const { container } = render(
    <div>
      <p>
        <InlineCode look="name" href="#x">
          _sync_as
        </InlineCode>{' '}
        <InlineCode look="location" href="#x">
          harness/controller.py:540
        </InlineCode>
      </p>
      <div className="ui-dt-body" style={{ background: 'var(--surface-sub)' }}>
        <InlineCode look="name" onClick={() => {}}>
          _sync_as
        </InlineCode>
      </div>
    </div>,
  );
  const [name, loc, cell] = Array.from(container.querySelectorAll<HTMLElement>('.ui-code'));
  expect(name.className).toContain('is-name');
  expect(loc.className).toContain('is-location');
  const bg = root.getPropertyValue('--bg');
  expect(contrast(getComputedStyle(name).color, bg)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(getComputedStyle(loc).color, bg)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(getComputedStyle(cell).color, root.getPropertyValue('--surface-sub'))).toBeGreaterThanOrEqual(4.5);
  // No chip: the name sits on the text's own background.
  expect(getComputedStyle(name).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(getComputedStyle(loc).fontSize).toBe('13px');
});

test('look needs a target: text that points nowhere keeps the chip', () => {
  // @ts-expect-error look="name" without href or onClick does not compile
  const bad = <InlineCode look="name">x</InlineCode>;
  const { container } = render(bad);
  expect(container.querySelector('code.ui-code:not(.is-name)')).not.toBeNull();
});

test('CodeText: a reference that points somewhere is a location; other spans keep the chip', () => {
  const { container } = render(<CodeText text="`ibmon_spawn` 在 `child.c:86` 設定 `IBTRACE_SHM`" onRef={() => {}} />);
  const codes = Array.from(container.querySelectorAll('.ui-code'));
  expect(codes.map((c) => c.classList.contains('is-location'))).toEqual([false, true, false]);
});

test('codeText keeps a number with its unit and a currency with its number: no-break spaces', () => {
  const { container } = render(<CodeText text={'上限 100 MB，費用 NT$ 1,280，或 US$ 40；`$ 5` 不動，CPU 3 個'} />);
  const text = container.textContent ?? '';
  expect(text).toContain('100 MB');
  expect(text).toContain('NT$ 1,280');
  expect(text).toContain('US$ 40');
  expect(text).toContain('3 個');
  // Code spans are left as written.
  expect(container.querySelector('code')?.textContent).toBe('$ 5');
});
