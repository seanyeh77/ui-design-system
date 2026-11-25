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

test('actions without a title: no spacer, the actions sit at the right edge like beside a title', () => {
  const { container } = render(
    <div style={{ width: 600 }}>
      <Card actions={<button type="button">新增</button>}>內容</Card>
      <Card title="專案" actions={<button type="button">新增</button>}>
        內容
      </Card>
    </div>,
  );
  const [lone, titled] = [...container.querySelectorAll<HTMLElement>('.ui-card')];
  const head = lone.querySelector('.ui-card-head') as HTMLElement;
  expect(head.children.length).toBe(1);
  const right = (card: HTMLElement) =>
    card.getBoundingClientRect().right - (card.querySelector('.ui-card-actions') as HTMLElement).getBoundingClientRect().right;
  expect(right(lone)).toBe(16);
  expect(right(titled)).toBe(16);
});

test('padding: false: the summary tabs keep 16 px from the card edges as a margin, their track inside it', () => {
  const { container } = render(
    <div style={{ width: 900 }}>
      <Card title="項目" padding={false}>
        <DataTable
          label="項目"
          urlSync={false}
          rows={[
            { id: 1, name: 'a', s: 'done' },
            { id: 2, name: 'b', s: 'fail' },
          ]}
          columns={[
            { key: 'name', label: '名稱' },
            { key: 's', label: '狀態' },
          ]}
          summary={{
            key: 's',
            items: [
              { value: 'fail', label: '失敗' },
              { value: 'done', label: '完成' },
            ],
          }}
        />
      </Card>
    </div>,
  );
  const card = (container.querySelector('.ui-card') as HTMLElement).getBoundingClientRect();
  const sum = container.querySelector('.ui-dt-summary') as HTMLElement;
  expect(sum.getBoundingClientRect().left - card.left).toBe(16);
  expect(getComputedStyle(sum).paddingLeft).toBe('4px');
});

test('Card: actions that do not fit beside 8 characters of title move under it; the title is not cut to 「訂..」', () => {
  const { container } = render(
    <div style={{ width: 320 }}>
      <Card
        title="訂單明細與出貨紀錄"
        actions={
          <>
            <button type="button" style={{ width: 96, height: 40 }}>
              匯出
            </button>
            <button type="button" style={{ width: 96, height: 40 }}>
              列印
            </button>
          </>
        }
      >
        內容
      </Card>
    </div>,
  );
  const title = container.querySelector('.ui-card-title') as HTMLElement;
  const actions = container.querySelector('.ui-card-actions') as HTMLElement;
  expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth);
  expect(actions.getBoundingClientRect().top).toBeGreaterThanOrEqual(title.getBoundingClientRect().bottom);
  expect(Math.round(actions.getBoundingClientRect().right)).toBe(
    Math.round((container.querySelector('.ui-card') as HTMLElement).getBoundingClientRect().right - 16),
  );
});
