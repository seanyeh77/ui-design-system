// @vitest-environment jsdom
/*
 * Server rendering with a clock that differs from the browser's: the hydrated page must show the browser's relative
 * time, not keep the server's text (suppressHydrationWarning alone keeps the server DOM).
 */
import * as React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';
import { act } from '@testing-library/react';
import { DataTable, RelativeTime } from '../../index';

// The event: 2026/11/18 09:50 in Taipei. The server's clock reads 10:00, the browser's 3 hours later.
const EVENT = new Date('2026-11-18T09:50:00+08:00');
const SERVER_NOW = new Date('2026-11-18T10:00:00+08:00');
const CLIENT_NOW = new Date(SERVER_NOW.getTime() + 3 * 3600_000);

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

async function serverThenClient(node: React.ReactElement): Promise<HTMLElement> {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(SERVER_NOW);
  const html = renderToString(node);
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.append(container);
  vi.setSystemTime(CLIENT_NOW);
  const errors: unknown[] = [];
  await act(async () => {
    hydrateRoot(container, node, { onRecoverableError: (e) => errors.push(e) });
  });
  await act(() => Promise.resolve());
  expect(errors).toEqual([]);
  return container;
}

test('RelativeTime: the server renders the full date and time, the hydrated page the browser clock’s relative time', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(SERVER_NOW);
  expect(renderToString(<RelativeTime value={EVENT} />)).toContain('2026/11/18（三）09:50');
  vi.useRealTimers();
  const c = await serverThenClient(<RelativeTime value={EVENT} />);
  const t = c.querySelector('time')!;
  expect(t.textContent).toBe('3 小時前');
  expect(t.getAttribute('datetime')).toBe(EVENT.toISOString());
});

test('DataTable format relative: the hydrated table shows the browser clock’s relative time', async () => {
  const c = await serverThenClient(
    <DataTable
      label="事件"
      rows={[{ id: 'a', name: '部署', at: EVENT }]}
      columns={[
        { key: 'name', label: '名稱' },
        { key: 'at', label: '時間', format: 'relative' },
      ]}
    />,
  );
  expect(c.querySelector('time')?.textContent).toBe('3 小時前');
});
