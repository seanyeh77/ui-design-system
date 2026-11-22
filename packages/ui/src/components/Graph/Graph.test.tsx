import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GraphDefs, GraphLegend } from '../../index';

test('GraphDefs: the two arrowheads the README names, url(#ui-arrow) and url(#ui-arrow-accent)', () => {
  const { container } = render(
    <svg>
      <GraphDefs />
    </svg>,
  );
  expect(container.querySelector('marker#ui-arrow')).toBeTruthy();
  expect(container.querySelector('marker#ui-arrow-accent path.is-accent')).toBeTruthy();
});

test('GraphLegend: three default items in words; swatches are hidden from screen readers', () => {
  const { container } = render(<GraphLegend />);
  const items = Array.from(container.querySelectorAll('.ui-graph-legend-item'));
  expect(items.map((i) => i.textContent)).toEqual(['確定的關係', '推測的關係', '外部項目']);
  for (const svg of Array.from(container.querySelectorAll('svg'))) expect(svg.getAttribute('aria-hidden')).toBe('true');
});

test('GraphLegend: own words; an item with text is a Term that can be opened', () => {
  const { container } = render(
    <GraphLegend
      items={[
        { type: 'edge', label: '呼叫' },
        { type: 'inferred', label: '推測的呼叫', text: '從函式指標推測，可能不準。' },
        { type: 'weight', label: '次數' },
      ]}
    />,
  );
  expect(screen.getByRole('button', { name: /推測的呼叫/ })).toBeTruthy();
  expect(container.querySelectorAll('.ui-graph-legend-item').length).toBe(3);
  // weight shows a thin and a thick line.
  expect(container.querySelectorAll('.ui-graph-legend-item')[2].querySelectorAll('svg').length).toBe(2);
});
