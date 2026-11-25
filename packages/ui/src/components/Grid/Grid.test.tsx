import type * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from '@testing-library/react';
import { FormGrid, Grid, Page } from '../../index';

afterEach(async () => {
  await page.viewport(1280, 800);
});

const cols = (el: Element | null) => getComputedStyle(el as Element).gridTemplateColumns.split(' ').length;

test('Grid: 3 columns from 960 px, 2 on a tablet, 1 on a phone', async () => {
  const { container } = render(
    <Page>
      <Grid>
        <div>a</div>
        <div>b</div>
        <div>c</div>
      </Grid>
    </Page>,
  );
  const grid = container.querySelector('.ui-grid');
  await page.viewport(1280, 800);
  expect(cols(grid)).toBe(3);
  await page.viewport(800, 800);
  expect(cols(grid)).toBe(2);
  await page.viewport(390, 800);
  expect(cols(grid)).toBe(1);
});

test('Grid: columns 4 and 6 from 1280 px', async () => {
  await page.viewport(1280, 800);
  const { container } = render(
    <>
      <Grid columns={4}>
        <div>a</div>
      </Grid>
      <Grid columns={6}>
        <div>a</div>
      </Grid>
    </>,
  );
  const [four, six] = Array.from(container.querySelectorAll('.ui-grid'));
  expect(cols(four)).toBe(4);
  expect(cols(six)).toBe(6);
});

test('Grid: from 960 px to 1279 px, columns 3 stays 3, 4 becomes 2 and 6 becomes 3', async () => {
  const { container } = render(
    <>
      <Grid>
        <div>a</div>
      </Grid>
      <Grid columns={4}>
        <div>a</div>
      </Grid>
      <Grid columns={6}>
        <div>a</div>
      </Grid>
      <Grid columns={2}>
        <div>a</div>
      </Grid>
    </>,
  );
  const [three, four, six, two] = Array.from(container.querySelectorAll('.ui-grid'));
  await page.viewport(1000, 800);
  expect([cols(three), cols(four), cols(six), cols(two)]).toEqual([3, 2, 3, 2]);
  await page.viewport(800, 800);
  expect([cols(three), cols(four), cols(six), cols(two)]).toEqual([2, 2, 2, 2]);
});

test('FormGrid: two columns when the grid is 640 px wide or more, whatever the window; one in a 400 px drawer', async () => {
  const { container } = render(
    <>
      <div style={{ width: 400 }}>
        <FormGrid>
          <div>a</div>
          <div>b</div>
        </FormGrid>
      </div>
      <div style={{ width: 700 }}>
        <FormGrid>
          <div>a</div>
          <div>b</div>
        </FormGrid>
      </div>
    </>,
  );
  const [narrow, wide] = Array.from(container.querySelectorAll('.ui-formgrid-in'));
  await page.viewport(1280, 800);
  expect([cols(narrow), cols(wide)]).toEqual([1, 2]);
  await page.viewport(800, 800);
  expect([cols(narrow), cols(wide)]).toEqual([1, 2]);
});

test('Grid: columns={[2, 1]} is a main column twice the aside from 960 px, one column below', async () => {
  const { container } = render(
    <Grid columns={[2, 1]}>
      <div>main</div>
      <div>aside</div>
    </Grid>,
  );
  const grid = container.querySelector('.ui-grid') as HTMLElement;
  await page.viewport(1280, 800);
  const [a, b] = getComputedStyle(grid).gridTemplateColumns.split(' ').map(parseFloat);
  expect(Math.abs(a - 2 * b)).toBeLessThan(1);
  await page.viewport(800, 800);
  expect(cols(grid)).toBe(1);
});

test('Grid: a Page as one cell stacks its cards 24 px apart, the same as the columns', async () => {
  await page.viewport(1280, 900);
  const { container } = render(
    <Grid columns={[2, 1]}>
      <Page>
        <div style={{ height: 100 }}>主要 1</div>
        <div style={{ height: 100 }}>主要 2</div>
      </Page>
      <div style={{ height: 80 }}>側欄</div>
    </Grid>,
  );
  const [a, b] = [...container.querySelectorAll('.ui-page > div')].map((e) => e.getBoundingClientRect());
  expect(b.top - a.bottom).toBe(24);
  const side = (container.querySelector('.ui-grid > div:last-child') as HTMLElement).getBoundingClientRect();
  expect(side.left - a.right).toBe(24);
});

test('Grid: equal columns stretch a row to its tallest card, a ratio stays at the top; align overrides both', async () => {
  await page.viewport(1280, 900);
  const cells = (columns: React.ComponentProps<typeof Grid>['columns'], align?: 'start' | 'stretch') => {
    const { container, unmount } = render(
      <Grid columns={columns} align={align}>
        <div style={{ minHeight: 200 }}>高</div>
        <div>矮</div>
      </Grid>,
    );
    const h = [...container.querySelectorAll('.ui-grid > div')].map((e) => Math.round(e.getBoundingClientRect().height));
    unmount();
    return h;
  };
  expect(cells(2)[1]).toBe(200);
  expect(cells([2, 1])[1]).toBeLessThan(200);
  expect(cells([2, 1], 'stretch')[1]).toBe(200);
  expect(cells(2, 'start')[1]).toBeLessThan(200);
});
