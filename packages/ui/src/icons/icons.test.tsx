// The icons load one module each: this file imports neither index.ts nor all.ts, which would put every icon in the page.
import { afterEach, expect, test, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { Icon, IconOf, type IconName } from './Icon';
import { includeIcons, preloadIcons } from './store';
import { LOAD, PH_ALIAS } from './names';
import phHouse from './ph/house';
import phStar from './ph/star';
import phHeart from './ph/heart';
import phMagnifyingGlass from './ph/magnifying-glass';
import allSource from './all.ts?raw';

afterEach(() => vi.restoreAllMocks());

const svgOf = (el: Element) => el.querySelector('svg.ui-icon') as SVGSVGElement;
/** Markup as the browser serializes it inside an svg. */
const dom = (markup: string) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.innerHTML = markup;
  return svg.innerHTML;
};

test('a name loads on first use: an empty box of the icon size first, then the icon; the next render has it at once', async () => {
  const first = render(<Icon name="house" size={24} />);
  const box = svgOf(first.container);
  expect(box.innerHTML).toBe('');
  expect(box.getAttribute('viewBox')).toBe('0 0 256 256');
  const r = box.getBoundingClientRect();
  expect([r.width, r.height]).toEqual([24, 24]);
  await waitFor(() => expect(svgOf(first.container).innerHTML).toBe(dom(phHouse.r)));
  // Same element, same size: nothing moves when the icon arrives.
  expect(svgOf(first.container)).toBe(box);
  expect(box.getBoundingClientRect().width).toBe(24);
  first.unmount();

  const second = render(<Icon name="house" size={24} />);
  expect(svgOf(second.container).innerHTML).toBe(dom(phHouse.r));
});

test('filled shows the fill version, and an alias loads the icon it names', async () => {
  const { container } = render(
    <>
      <Icon name="star" filled />
      <IconOf icon="search" />
    </>,
  );
  const [star, search] = container.querySelectorAll('svg');
  await waitFor(() => expect(star.innerHTML).toBe(dom(phStar.f)));
  await waitFor(() => expect(search.innerHTML).toBe(dom(phMagnifyingGlass.r)));
});

test('preloadIcons: icons shown after it resolves render at once', async () => {
  await preloadIcons(['sun', 'moon']);
  const { container } = render(
    <>
      <Icon name="sun" />
      <Icon name="moon" />
    </>,
  );
  for (const svg of container.querySelectorAll('svg')) expect(svg.innerHTML).toMatch(/^<path/);
});

test('an icon a module includes renders at once in the browser; the server renders only preloaded icons', async () => {
  includeIcons(phHeart);
  expect(svgOf(render(<Icon name="heart" />).container).innerHTML).toBe(dom(phHeart.r));
  expect(renderToString(<Icon name="heart" />)).not.toContain(phHeart.r);
  await preloadIcons(['heart']);
  expect(renderToString(<Icon name="heart" />)).toContain(phHeart.r);
});

test('server render: a name not in the page code is the empty box, without errors', () => {
  const html = renderToString(<Icon name="gear" size={18} />);
  expect(html).toMatch(/^<svg[^>]*width="18"[^>]*height="18"[^>]*><\/svg>$/);
});

test('hydration of a server-rendered box: no mismatch, then the icon appears', async () => {
  const errors = vi.spyOn(console, 'error');
  const host = document.createElement('div');
  host.innerHTML = renderToString(<Icon name="globe" />);
  document.body.append(host);
  expect(host.querySelector('svg')?.innerHTML).toBe('');
  const root = hydrateRoot(host, <Icon name="globe" />);
  await waitFor(() => expect(host.querySelector('svg')?.innerHTML).toMatch(/^<path/));
  expect(errors).not.toHaveBeenCalled();
  root.unmount();
  host.remove();
});

test('an unknown name warns in development and renders an empty box', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { container } = render(<Icon name={'not-an-icon' as IconName} />);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('"not-an-icon" is not a built-in icon name'));
  expect(svgOf(container).innerHTML).toBe('');
});

test('custom icons render as before: 24 px path data and SVG markup', () => {
  const { container } = render(
    <>
      <Icon d="M4 12h16" />
      <IconOf icon={'<circle cx="128" cy="128" r="64"/>'} />
    </>,
  );
  const [path, markup] = container.querySelectorAll('svg');
  expect(path.getAttribute('viewBox')).toBe('0 0 24 24');
  expect(path.querySelector('path')?.getAttribute('d')).toBe('M4 12h16');
  expect(markup.innerHTML).toBe('<circle cx="128" cy="128" r="64"></circle>');
});

// Every icon: a module under ph/ named after it, a loader in names.ts and an entry in all.ts.
const modules = import.meta.glob<() => Promise<{ default: { n: string } }>>('./ph/*.ts');
test('ph/, names.ts and all.ts list the same icons', async () => {
  const files = Object.keys(modules)
    .map((p) => p.slice(5, -3))
    .sort();
  expect(Object.keys(LOAD).sort()).toEqual(files);
  const listed = [...allSource.matchAll(/^import \w+ from '\.\/ph\/([\w-]+)';$/gm)].map((m) => m[1]).sort();
  expect(listed).toEqual(files);
  for (const target of Object.values(PH_ALIAS)) expect(files).toContain(target);
  for (const [path, load] of Object.entries(modules)) expect((await load()).default.n).toBe(path.slice(5, -3));
});

// A component that always shows an icon includes it, so the icon is in the browser's first paint. The
// check looks for names in icon positions (name=, icon=, icon:, a *_ICONS constant) and asks for the module import.
const sources = import.meta.glob<string>(['../components/**/*.tsx', '../internal/*.tsx', '!../**/*.test.tsx', '!../**/*.stories.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
});
test('components include the icons they always show', () => {
  const isName = (s: string) => Object.hasOwn(LOAD, s) || Object.hasOwn(PH_ALIAS, s);
  const phosphor = (s: string) => (Object.hasOwn(LOAD, s) ? s : PH_ALIAS[s as keyof typeof PH_ALIAS]);
  const position = /(?<![\w.$-])(?:name|icon)\s*[=:]\s*(\{(?:[^{}]|\{[^{}]*\})*\}|'[^']*'|"[^"]*")/g;
  const constant = /const [A-Z_]*ICONS?\b[^=]*=\s*(\{[^}]*\}|'[^']*')/g;
  const missing: string[] = [];
  expect(Object.keys(sources).length).toBeGreaterThan(50);
  for (const [file, code] of Object.entries(sources)) {
    const shown = new Set<string>();
    for (const re of [position, constant])
      for (const m of code.matchAll(re)) for (const q of m[1].matchAll(/'([^']*)'|"([^"]*)"/g)) if (isName(q[1] ?? q[2])) shown.add(phosphor(q[1] ?? q[2]));
    for (const n of shown) if (!code.includes(`/icons/ph/${n}';`) || !code.includes('includeIcons(')) missing.push(`${file}: ${n}`);
  }
  expect(missing).toEqual([]);
});
