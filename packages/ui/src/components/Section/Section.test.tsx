import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Section, SectionGroup } from '../../index';

afterEach(() => {
  localStorage.clear();
  history.replaceState(null, '', location.pathname);
});

test('Section: a heading holding a button with aria-expanded and aria-controls; Enter and Space toggle', async () => {
  const user = userEvent.setup();
  render(
    <Section title="外部指令" summary="29 個指令、4 個 namespace">
      <p>ibv_post_send</p>
    </Section>,
  );
  const heading = screen.getByRole('heading', { level: 3, name: /外部指令/ });
  const btn = screen.getByRole('button', { name: '外部指令 29 個指令、4 個 namespace' });
  expect(heading.contains(btn)).toBe(true);
  expect(btn.getAttribute('aria-expanded')).toBe('false');
  const body = document.getElementById(btn.getAttribute('aria-controls') ?? '');
  expect(body?.textContent).toBe('ibv_post_send');
  btn.focus();
  await user.keyboard('{Enter}');
  expect(btn.getAttribute('aria-expanded')).toBe('true');
  await user.keyboard(' ');
  expect(btn.getAttribute('aria-expanded')).toBe('false');
});

test('Section: closed content stays in the page as hidden="until-found" (not lazy); lazy renders nothing', async () => {
  render(
    <>
      <Section title="A">甲的內容</Section>
      <Section title="B" lazy>
        乙的內容
      </Section>
    </>,
  );
  await waitFor(() => expect(screen.getByText('甲的內容').closest('.ui-sec-in')?.getAttribute('hidden')).toBe('until-found'));
  expect(screen.queryByText('乙的內容')).toBeNull();
  await userEvent.setup().click(screen.getByRole('button', { name: 'B' }));
  expect(screen.getByText('乙的內容')).toBeTruthy();
});

test('Section: the browser find (beforematch) opens it', async () => {
  render(<Section title="A">甲的內容</Section>);
  const inner = screen.getByText('甲的內容').closest('.ui-sec-in') as HTMLElement;
  await waitFor(() => expect(inner.getAttribute('hidden')).toBe('until-found'));
  inner.dispatchEvent(new Event('beforematch'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'A' }).getAttribute('aria-expanded')).toBe('true'));
});

test('Section: controlled open and onOpenChange', async () => {
  const seen: boolean[] = [];
  function Demo() {
    const [open, setOpen] = React.useState(true);
    return (
      <Section
        title="元件"
        open={open}
        onOpenChange={(v) => {
          seen.push(v);
          setOpen(v);
        }}
      >
        內容
      </Section>
    );
  }
  render(<Demo />);
  const btn = screen.getByRole('button', { name: '元件' });
  expect(btn.getAttribute('aria-expanded')).toBe('true');
  await userEvent.setup().click(btn);
  expect(seen).toEqual([false]);
  expect(btn.getAttribute('aria-expanded')).toBe('false');
});

test('Section: the address hash opens it; storageKey remembers; blocked storage still works', async () => {
  history.replaceState(null, '', '#ext');
  const { unmount } = render(
    <Section id="ext" title="外部指令" storageKey="t-ext">
      內容
    </Section>,
  );
  await waitFor(() => expect(screen.getByRole('button', { name: '外部指令' }).getAttribute('aria-expanded')).toBe('true'));
  expect(localStorage.getItem('ui-section:t-ext')).toBe('1');
  unmount();
  history.replaceState(null, '', location.pathname);
  render(
    <Section title="外部指令" storageKey="t-ext">
      內容
    </Section>,
  );
  expect(screen.getByRole('button', { name: '外部指令' }).getAttribute('aria-expanded')).toBe('true');
  const set = Storage.prototype.setItem;
  Storage.prototype.setItem = () => {
    throw new Error('blocked');
  };
  try {
    await userEvent.setup().click(screen.getByRole('button', { name: '外部指令' }));
    expect(screen.getByRole('button', { name: '外部指令' }).getAttribute('aria-expanded')).toBe('false');
  } finally {
    Storage.prototype.setItem = set;
  }
});

test('SectionGroup: 「全部展開」「全部收合」 with icons; the one that changes nothing is disabled', async () => {
  const user = userEvent.setup();
  render(
    <SectionGroup>
      <Section title="元件" defaultOpen>
        一
      </Section>
      <Section title="外部指令">二</Section>
      <Section title="設定">三</Section>
    </SectionGroup>,
  );
  const expand = screen.getByRole('button', { name: '全部展開' });
  const collapse = screen.getByRole('button', { name: '全部收合' });
  expect(expand.querySelector('svg')).not.toBeNull();
  expect(collapse.querySelector('svg')).not.toBeNull();
  await user.click(expand);
  for (const n of ['元件', '外部指令', '設定']) expect(screen.getByRole('button', { name: n }).getAttribute('aria-expanded')).toBe('true');
  await waitFor(() => expect((expand as HTMLButtonElement).disabled).toBe(true));
  await user.click(collapse);
  for (const n of ['元件', '外部指令', '設定']) expect(screen.getByRole('button', { name: n }).getAttribute('aria-expanded')).toBe('false');
  await waitFor(() => expect((collapse as HTMLButtonElement).disabled).toBe(true));
});
