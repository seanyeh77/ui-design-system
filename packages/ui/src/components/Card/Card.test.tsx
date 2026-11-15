import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Card, DataTable } from '../../index';

test('padding: false keeps 16 px around the title and the DataTable tools; the table reaches the card edges', () => {
  const { container } = render(
    <div style={{ width: 900 }}>
      <Card title="每個程式的耗時" padding={false}>
        <DataTable label="每個程式的耗時" rows={[{ id: 1, name: 'ib_write_bw' }]} columns={[{ key: 'name', label: '程式' }]} />
      </Card>
    </div>,
  );
  const card = (container.querySelector('.ui-card') as HTMLElement).getBoundingClientRect();
  const title = (container.querySelector('.ui-card-title') as HTMLElement).getBoundingClientRect();
  const head = container.querySelector('.ui-card-head') as HTMLElement;
  expect(title.left - card.left).toBe(16);
  expect(getComputedStyle(head).paddingTop).toBe('16px');
  const tools = container.querySelector('.ui-dt-tools') as HTMLElement;
  const first = (tools.firstElementChild as HTMLElement).getBoundingClientRect();
  const last = (tools.lastElementChild as HTMLElement).getBoundingClientRect();
  expect(first.left - card.left).toBe(16);
  expect(card.right - last.right).toBe(16);
  const scroll = container.querySelector('.ui-dt-scroll') as HTMLElement;
  expect(scroll.getBoundingClientRect().left).toBe(card.left);
  expect(getComputedStyle(scroll).borderLeftWidth).toBe('0px');
});
