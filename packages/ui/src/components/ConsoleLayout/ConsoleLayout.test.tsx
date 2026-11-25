import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { page } from 'vitest/browser';
import * as React from 'react';
import { ConsoleLayout } from '../../index';
import { consoleZoom } from './ConsoleLayout';

test('zoom is 1 up to 1440 × 900, grows with the screen, at most 1.5', () => {
  expect(consoleZoom(1366, 768)).toBe(1);
  expect(consoleZoom(1440, 900)).toBe(1);
  expect(consoleZoom(1920, 1080)).toBe(1.2);
  expect(consoleZoom(3840, 2160)).toBe(1.5);
});

function Demo({ height }: { height: number }) {
  return (
    <div style={{ height }}>
      {/* The layout fills its parent here (the test page), not the screen. */}
      <style>{'.test-console{height:100%}'}</style>
      <ConsoleLayout
        className="test-console"
        title="機房監控"
        status="AI 最佳化中"
        clock="即時"
        main={<div>主視覺</div>}
        side={<div>時間控制</div>}
        bottom={<div>底列</div>}
        extras={[{ id: 'a', minHeight: 1040, node: <div>卡 A</div> }]}
      />
    </div>
  );
}

test('one heading; extra cards only on tall screens; the side panel is labelled', async () => {
  await page.viewport(1280, 800);
  const { rerender } = render(<Demo height={800} />);
  expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual(['機房監控']);
  expect(screen.getByRole('complementary', { name: '側欄' }).textContent).toContain('時間控制');
  expect(screen.queryByText('卡 A')).toBeNull();
  rerender(<Demo height={1100} />);
  await expect.poll(() => screen.queryByText('卡 A') != null).toBe(true);
});

test('phones get one column with every card, no side panel', async () => {
  await page.viewport(390, 844);
  render(<Demo height={844} />);
  await expect.poll(() => screen.queryByRole('complementary')).toBeNull();
  expect(screen.getByText('卡 A')).not.toBeNull();
  expect(screen.queryByRole('button', { name: '全螢幕' })).toBeNull();
  await page.viewport(1280, 800);
});
