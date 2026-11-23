import * as React from 'react';
import { beforeAll, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from '@testing-library/react';
import { ProjectSwitcher } from '../../index';

// Wider than a phone: phones show the dot alone, without the status words.
beforeAll(() => page.viewport(1280, 800));

const must = <T,>(x: T | null | undefined): T => {
  if (x == null) throw new Error('not rendered');
  return x;
};

// The left edge of the n-th character of the status text, and the right edge of the name.
const edges = (chip: HTMLElement) => {
  const name = must(chip.querySelector<HTMLElement>('.ui-projsw-name'));
  const status = must(chip.querySelector<HTMLElement>('.ui-projsw-status'));
  const text = must(status.firstChild);
  const at = (i: number) => {
    const r = document.createRange();
    r.setStart(text, i);
    r.setEnd(text, i + 1);
    return r.getBoundingClientRect();
  };
  return { name: name.getBoundingClientRect().right, space: at(0), dot: at(1), after: at(2) };
};

test.each([
  ['static, default status label', {}],
  ['static, own status label', { statusLabel: '快照 a085bc3' }],
  ['menu', { options: [{ id: 'audio-demo', label: 'audio-demo' }], value: 'audio-demo', onChange: () => {} }],
])('「專案 · 狀態」 keeps one space on each side of 「·」 (%s)', (_, extra) => {
  const { container } = render(
    <div style={{ width: 600 }}>
      <ProjectSwitcher project="audio-demo" status="live" {...extra} />
    </div>,
  );
  const chip = must(container.querySelector<HTMLElement>('.ui-projsw'));
  const stText = 'statusLabel' in extra ? extra.statusLabel : '即時';
  expect(chip.querySelector('.ui-projsw-text')?.textContent).toBe(`audio-demo · ${stText}`);
  expect(chip.getAttribute('title')).toBe(`audio-demo · ${stText}`);
  // Drawn, not only in the text: the leading space has a width, so 「·」 does not touch the name.
  const e = edges(chip);
  expect(e.space.width).toBeGreaterThan(1);
  expect(e.dot.left - e.name).toBeGreaterThan(1);
  expect(e.after.width).toBeGreaterThan(1);
});

test('a name shorter than 3em keeps its own width: no gap before 「·」', () => {
  const { container } = render(
    <div style={{ width: 600 }}>
      <ProjectSwitcher project="web" status="stale" statusLabel="production" />
    </div>,
  );
  const name = must(container.querySelector<HTMLElement>('.ui-projsw-name'));
  const r = document.createRange();
  r.selectNodeContents(name);
  expect(Math.abs(name.getBoundingClientRect().width - r.getBoundingClientRect().width)).toBeLessThan(1);
});
