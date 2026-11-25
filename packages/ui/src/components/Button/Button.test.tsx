import * as React from 'react';
import { expect, test, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Button, IconButton } from '../../index';

const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

test('Button: loading keeps focus on the button, with aria-disabled and aria-busy, and ignores presses', async () => {
  const onClick = vi.fn();
  function Page() {
    const [loading, setLoading] = React.useState(false);
    return (
      <form onSubmit={(e) => e.preventDefault()}>
        <Button variant="primary" loading={loading} onClick={() => (onClick(), setLoading(true))}>
          儲存
        </Button>
      </form>
    );
  }
  render(<Page />);
  const btn = screen.getByRole('button', { name: '儲存' });
  btn.focus();
  const user = userEvent.setup();
  await user.keyboard('{Enter}');
  await frames();
  expect(btn.getAttribute('aria-disabled')).toBe('true');
  expect(btn.getAttribute('aria-busy')).toBe('true');
  expect(btn.hasAttribute('disabled')).toBe(false);
  expect(document.activeElement).not.toBe(document.body);
  expect(document.activeElement).toBe(btn);
  // A second press while loading does nothing.
  await user.keyboard('{Enter}');
  expect(onClick).toHaveBeenCalledTimes(1);
});

test('Button: disabled while focused hands focus to the control before it', async () => {
  function Page() {
    const [live, setLive] = React.useState(false);
    return (
      <section aria-label="時間">
        <Button onClick={() => setLive(false)}>回放</Button>
        <Button onClick={() => setLive(true)} disabled={live}>
          回到現在
        </Button>
      </section>
    );
  }
  render(<Page />);
  const now = screen.getByRole('button', { name: '回到現在' });
  now.focus();
  await userEvent.setup().keyboard('{Enter}');
  await frames();
  expect(now.hasAttribute('disabled')).toBe(true);
  expect(document.activeElement).not.toBe(document.body);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: '回放' }));
});

test('IconButton: disabled while focused hands focus to a neighbour', async () => {
  function Page() {
    const [off, setOff] = React.useState(false);
    return (
      <div role="toolbar" aria-label="工具">
        <IconButton icon="plus" label="新增" />
        <IconButton icon="trash" label="刪除" disabled={off} onClick={() => setOff(true)} />
      </div>
    );
  }
  render(<Page />);
  const del = screen.getByRole('button', { name: '刪除' });
  del.focus();
  await act(async () => {
    await userEvent.setup().keyboard('{Enter}');
  });
  await frames();
  expect(document.activeElement).not.toBe(document.body);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: '新增' }));
});
