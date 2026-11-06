import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { DataTable } from '../../index';

const cols = [{ key: 'name' as const, label: '名稱' }];

test('bulk actions only get the ids of rows that still exist', async () => {
  const bulk = vi.fn(() => null);
  const rows = [
    { id: 'a', name: 'alpha' },
    { id: 'b', name: 'beta' },
  ];
  const { rerender } = render(<DataTable columns={cols} rows={rows} selectable bulkActions={bulk} />);
  await userEvent.setup().click(screen.getAllByRole('checkbox', { name: '選取第 1 筆' })[0]);
  expect(bulk).toHaveBeenLastCalledWith(['a'], expect.any(Function));
  bulk.mockClear();
  rerender(<DataTable columns={cols} rows={rows.slice(1)} selectable bulkActions={bulk} />);
  // The deleted row no longer counts: the bulk bar is gone and never gets its id.
  expect(bulk).not.toHaveBeenCalledWith(['a'], expect.any(Function));
  expect(screen.queryByRole('button', { name: '取消選取' })).toBeNull();
});
