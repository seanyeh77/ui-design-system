import * as React from 'react';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { cdp, page } from 'vitest/browser';
import { render } from '@testing-library/react';
import * as UI from './index';

// A touch screen: a tap anywhere in the 48 x 48 px square around a control's center reaches that control, even when
// the control looks smaller (its ::after draws the rest). Inside a sentence links keep their line (WCAG 2.2 inline exception).
beforeAll(async () => {
  await page.viewport(390, 844);
  await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'pointer', value: 'coarse' },
      { name: 'hover', value: 'none' },
    ],
  });
});
afterAll(async () => {
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
  await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
});

const misses = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  return [
    [-22, 0],
    [22, 0],
    [0, -22],
    [0, 22],
  ].filter(([dx, dy]) => {
    const hit = document.elementFromPoint(cx + dx, cy + dy);
    return !(hit && (hit === el || el.contains(hit)));
  });
};

test('touch: small controls take taps across 48 x 48 px', async () => {
  const LONG = '找不到 child.c，完整路徑應為 src/ibmon/child.c:86，請改成完整路徑後重新執行檢查，再確認 IBTRACE_SHM 的設定';
  const { container } = render(
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <UI.InlineCode href="#a">child.c:86</UI.InlineCode>
      </div>
      <div style={{ height: 40 }} />
      <div>
        <UI.Term title="daemon" text="在背景執行的程式。">
          daemon
        </UI.Term>
      </div>
      <div style={{ height: 40 }} />
      <UI.DataTable urlSync={false} rows={[{ id: '1', t: LONG }]} columns={[{ key: 't', label: '說明', long: true }]} />
    </div>,
  );
  await new Promise((r) => setTimeout(r, 200));
  const els = container.querySelectorAll<HTMLElement>('.ui-code.is-link, .ui-term, .ui-dt-more');
  expect(els.length).toBe(3);
  const bad = [...els].map((el) => [el.className, misses(el)] as const).filter(([, m]) => m.length);
  expect(bad).toEqual([]);
});

test('touch: 「略過」 on the Tour card takes taps across 48 x 48 px', async () => {
  render(
    <div style={{ padding: 16 }}>
      <div id="tgt" style={{ height: 100 }}>
        目標
      </div>
      <UI.Tour
        open
        steps={[
          { target: '#tgt', title: '架構', text: '分層和呼叫關係。' },
          { title: '完成', text: '結束。' },
        ]}
      />
    </div>,
  );
  await new Promise((r) => setTimeout(r, 300));
  const skip = [...document.querySelectorAll<HTMLElement>('.ui-tour-actions button')].find((b) => b.textContent === '略過');
  expect(skip).toBeTruthy();
  if (skip) expect(misses(skip)).toEqual([]);
});

test('touch: a link inside a sentence keeps its line', async () => {
  const { container } = render(
    <p>
      見 <UI.InlineCode href="#b">child.c:86</UI.InlineCode> 的說明。
    </p>,
  );
  await new Promise((r) => setTimeout(r, 50));
  expect(container.querySelector('.ui-code')?.classList.contains('is-inline')).toBe(true);
});

test('touch: a cut-off cell opens no Tooltip; a tap on the row shows the whole text', async () => {
  const LONG = '找不到 child.c，完整路徑應為 src/ibmon/child.c:86，請改成完整路徑後重新執行檢查，再確認 IBTRACE_SHM 的設定';
  await page.viewport(820, 700);
  const { container } = render(
    <div style={{ width: 760 }}>
      <UI.DataTable
        urlSync={false}
        search={false}
        rows={[
          { id: '1', name: 'main.c', t: LONG },
          { id: '2', name: 'shm.c', t: LONG },
        ]}
        columns={[
          { key: 'name', label: '名稱' },
          { key: 't', label: '說明', long: true },
        ]}
      />
    </div>,
  );
  await new Promise((r) => setTimeout(r, 150));
  const cell = container.querySelector<HTMLElement>('.ui-dt-long');
  cell?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
  cell?.click();
  await new Promise((r) => setTimeout(r, 150));
  expect(document.querySelectorAll('.ui-tooltip').length).toBe(0);
  // The tap on the row opened its details (EC); the caret closes them.
  expect(container.querySelector('.ui-dt-detail-text')?.textContent).toBe(LONG);
  container.querySelector<HTMLButtonElement>('.ui-dt-exp-btn')?.click();
  await new Promise((r) => setTimeout(r, 50));
  expect(container.querySelector('.ui-dt-detail')).toBeNull();
});

test('touch: a Tooltip closes on a tap elsewhere and on scroll', async () => {
  render(
    <div>
      <UI.Tooltip label="重新整理">
        <button type="button">更新</button>
      </UI.Tooltip>
      <button type="button">別處</button>
    </div>,
  );
  const tips = () => document.querySelectorAll('.ui-tooltip').length;
  const trigger = [...document.querySelectorAll('button')].find((b) => b.textContent === '更新');
  trigger?.focus();
  await new Promise((r) => setTimeout(r, 100));
  expect(tips()).toBe(1);
  // A tap on something else.
  [...document.querySelectorAll('button')].find((b) => b.textContent === '別處')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 100));
  expect(tips()).toBe(0);
  trigger?.blur();
  trigger?.focus();
  await new Promise((r) => setTimeout(r, 100));
  expect(tips()).toBe(1);
  document.dispatchEvent(new Event('scroll'));
  await new Promise((r) => setTimeout(r, 100));
  expect(tips()).toBe(0);
});
