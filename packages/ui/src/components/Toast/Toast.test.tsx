import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { act } from '@testing-library/react';
import { AppShell, SettingsLayout, Toast, Toaster, toast } from '../../index';

test('Toast: a polite status message; the caller times it, so it stays until removed', async () => {
  vi.useFakeTimers();
  try {
    render(<Toast>已刪除 3 筆</Toast>);
    const st = screen.getByRole('status');
    expect(st.textContent).toBe('已刪除 3\u00a0筆');
    // No timer of its own: still there long after 3 s.
    vi.advanceTimersByTime(10_000);
    expect(screen.getByRole('status')).toBe(st);
  } finally {
    vi.useRealTimers();
  }
  // Without actionLabel there is nothing to press.
  expect(screen.queryByRole('button')).toBeNull();
});

test('Toast: 復原 is a button inside the status and runs onAction once per press', async () => {
  const onAction = vi.fn();
  render(
    <Toast actionLabel="復原" onAction={onAction}>
      已刪除 3 筆
    </Toast>,
  );
  const undo = screen.getByRole('button', { name: '復原' });
  expect(screen.getByRole('status').contains(undo)).toBe(true);
  expect(undo.getAttribute('type')).toBe('button');
  const user = userEvent.setup();
  await user.click(undo);
  expect(onAction).toHaveBeenCalledTimes(1);
  // From the keyboard too.
  undo.focus();
  await user.keyboard('{Enter}');
  expect(onAction).toHaveBeenCalledTimes(2);
});

test('SettingsLayout: the deprecated toast prop shows through toast(), with its own Toaster, and closes when emptied', async () => {
  const cats = [{ id: 'a', label: '一般', content: <p>內容</p> }];
  const { rerender } = render(<SettingsLayout categories={cats} toast="已儲存" />);
  const region = await screen.findByRole('region', { name: '通知' });
  await vi.waitFor(() => expect(region.textContent).toContain('已儲存'));
  rerender(<SettingsLayout categories={cats} toast="" />);
  await vi.waitFor(() => expect(region.textContent).not.toContain('已儲存'));
});

test('Toaster: AppShell shows toasts without setup; a page Toaster takes over, so a toast never shows twice', async () => {
  const nav = [{ items: [{ id: 'a', label: '總覽', icon: 'house' as const }] }];
  const { rerender } = render(
    <AppShell nav={nav} value="a" onNavigate={() => {}} title="總覽">
      <p>內容</p>
    </AppShell>,
  );
  await vi.waitFor(() => expect(screen.getAllByRole('region', { name: '通知' })).toHaveLength(1));
  rerender(
    <AppShell nav={nav} value="a" onNavigate={() => {}} title="總覽">
      <Toaster />
    </AppShell>,
  );
  await vi.waitFor(() => expect(screen.getAllByRole('region', { name: '通知' })).toHaveLength(1));
  act(() => {
    toast('已儲存');
  });
  await vi.waitFor(() => expect(screen.getAllByText('已儲存')).toHaveLength(1));
  toast.close();
});

test('toast(): a plain message in the Toaster, inside a live region that was there before it, gone after 3 s', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    render(<Toaster />);
    // The region exists before any toast: screen readers read what is added to it.
    const region = screen.getByRole('region', { name: '通知' });
    expect(region.getAttribute('aria-live')).toBe('polite');
    act(() => {
      toast('已儲存');
    });
    expect(region.textContent).toContain('已儲存');
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    expect(region.textContent).toContain('已儲存');
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    await vi.waitFor(() => expect(region.textContent).not.toContain('已儲存'));
  } finally {
    vi.useRealTimers();
    toast.close();
  }
});

test('toast() with an undo action: stays past 3 s, names Ctrl Z, and Ctrl Z runs it once', async () => {
  const onAction = vi.fn();
  render(<Toaster />);
  act(() => {
    toast('已刪除 3 筆', { action: { label: '復原', onAction, undo: true } });
  });
  const undo = await screen.findByRole('button', { name: /復原/ });
  expect(undo.textContent).toMatch(/Z/);
  expect(undo.getAttribute('aria-keyshortcuts')).toMatch(/\+Z$/);
  await new Promise((r) => setTimeout(r, 3500));
  expect(screen.getByRole('button', { name: /復原/ })).toBeTruthy();
  const user = userEvent.setup();
  const mac = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);
  await user.keyboard(mac ? '{Meta>}z{/Meta}' : '{Control>}z{/Control}');
  expect(onAction).toHaveBeenCalledTimes(1);
  await vi.waitFor(() => expect(screen.queryByRole('button', { name: /復原/ })).toBeNull());
  toast.close();
});

test('toast() tone danger: a danger icon and an urgent announcement', async () => {
  render(<Toaster />);
  act(() => {
    toast('儲存失敗：網路中斷，請稍後再試', { tone: 'danger' });
  });
  await vi.waitFor(() => expect(document.querySelector('.ui-toast.is-danger')).toBeTruthy());
  toast.close();
});
