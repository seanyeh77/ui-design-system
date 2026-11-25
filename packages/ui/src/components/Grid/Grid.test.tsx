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

test('FormGrid: one column under 960 px, two from 960 px', async () => {
  const { container } = render(
    <FormGrid>
      <div>a</div>
      <div>b</div>
    </FormGrid>,
  );
  const fg = container.querySelector('.ui-formgrid');
  await page.viewport(960, 800);
  expect(cols(fg)).toBe(2);
  await page.viewport(959, 800);
  expect(cols(fg)).toBe(1);
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
