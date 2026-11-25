// A page that imports `icons` has every icon at once (its own file: icons.test.tsx needs a page without them).
import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { Icon } from './Icon';
import { icons } from './map';
import phStar from './ph/star';

const dom = (markup: string) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.innerHTML = markup;
  return svg.innerHTML;
};

test('with `icons` imported, every name renders at once; the markup of a built-in icon still finds its fill version', () => {
  // 113 icons, 40 Lucide aliases and 12 old names; the alias 'list' is also an icon name.
  expect(Object.keys(icons)).toHaveLength(164);
  expect(icons.search).toBe(icons['magnifying-glass']);
  const { container } = render(
    <>
      <Icon name="archive" />
      <Icon d={icons.star as `<${string}`} filled />
    </>,
  );
  const [archive, star] = container.querySelectorAll('svg');
  expect(archive.innerHTML).toBe(dom(icons.archive));
  expect(star.innerHTML).toBe(dom(phStar.f));
});

test('the server still renders only the icons components include, so it matches a browser bundle without `icons`', () => {
  expect(renderToString(<Icon name="archive" />)).not.toContain('<path');
});
