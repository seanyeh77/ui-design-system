import * as React from 'react';
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CommandPalette } from '../../index';

const detail =
  '呼叫；這行的 flow_priority 呼叫的是 harness/oracle.py:126 的定義，不是 controller.py:54 的同名方法，評分時使用原始的定義；學生修改 controller.py 不會改變評分結果，要改評分請修改 harness/oracle.py 並重新執行全部的測試';

// PAB: descriptions wrap onto two lines (cut from the third); the list reaches 24 px above the window's bottom.
test('CommandPalette: two-line descriptions; eight results fit a 1440 x 900 window (PAB)', async () => {
  await page.viewport(1440, 900);
  const items = Array.from({ length: 8 }, (_, i) => ({ label: `flow_priority_${i}`, kind: '函式', detail }));
  render(<CommandPalette open onOpenChange={() => {}} items={items} onSelect={() => {}} />);
  await userEvent.setup().type(await screen.findByRole('combobox'), 'flow');
  const det = document.querySelector('.ui-pal-detail') as HTMLElement;
  // Two lines of 20 px; sub-pixel layout can make it 39.x px, so within 1 px.
  const line = parseFloat(getComputedStyle(det).lineHeight);
  expect(Math.abs(det.getBoundingClientRect().height - 2 * line)).toBeLessThanOrEqual(1);
  // Without the clamp the same text takes three lines or more.
  det.style.webkitLineClamp = 'none';
  expect(det.getBoundingClientRect().height).toBeGreaterThan(50);
  det.style.webkitLineClamp = '';
  const pal = document.querySelector('.ui-pal') as HTMLElement;
  expect(pal.getBoundingClientRect().bottom).toBeLessThanOrEqual(900 - 24 + 0.5);
  const list = document.querySelector('.ui-pal-list') as HTMLElement;
  const last = [...document.querySelectorAll('.ui-pal-item')].at(-1) as HTMLElement;
  expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(list.getBoundingClientRect().bottom + 0.5);
});
