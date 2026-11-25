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
