import * as React from 'react';
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { DataTable } from '../../index';

const LONG = '找不到 child.c，完整路徑應為 src/ibmon/child.c:86，請改成完整路徑後重新執行檢查';
const tips = () => document.querySelectorAll('.ui-tooltip').length;

test('Tab through cut-off cells fast: one Tooltip at a time, closed once focus leaves', async () => {
  await page.viewport(1280, 800);
  const rows = ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id + '.c', text: id + LONG }));
  render(
    <React.StrictMode>
      <div style={{ width: 520 }}>
        <DataTable
          columns={[
            { key: 'name', label: '名稱' },
            { key: 'text', label: '說明', long: true },
          ]}
          rows={rows}
          urlSync={false}
          search={false}
        />
      </div>
      <button type="button">after</button>
    </React.StrictMode>,
  );
  await waitFor(() => expect(document.querySelectorAll('.ui-dt-long.is-cut').length).toBe(4));
  const user = userEvent.setup();
  const seen: number[] = [];
  for (let i = 0; i < 12; i++) {
    await user.tab();
    await new Promise((r) => setTimeout(r, 30));
    seen.push(tips());
  }
  expect(Math.max(...seen)).toBeLessThanOrEqual(1);
  // Focus leaves the table: nothing stays open.
  while (document.activeElement?.textContent !== 'after') await user.tab();
  await waitFor(() => expect(tips()).toBe(0));
});
