import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Checkbox, RadioGroup } from '../../index';

test('Checkbox and Radio: the focus outline and click area wrap the box and its text, not the whole row', () => {
  render(
    <div style={{ width: 1000 }}>
      <Checkbox label="接收通知" />
      <Checkbox label="每週摘要" />
      <RadioGroup label="頻率" value="d" onChange={() => {}} options={[{ value: 'd', label: '每天' }, { value: 'w', label: '每週' }]} />
    </div>,
  );
  const [a, b] = screen.getAllByRole('checkbox');
  expect(a.getBoundingClientRect().width).toBeLessThan(200);
  // Each still on its own line.
  expect(b.getBoundingClientRect().top).toBeGreaterThanOrEqual(a.getBoundingClientRect().bottom);
  const radio = screen.getByRole('radio', { name: '每天' });
  expect(radio.getBoundingClientRect().width).toBeLessThan(200);
});

test('a label longer than its container wraps inside it', () => {
  render(
    <div style={{ width: 200 }}>
      <Checkbox label="這是一段很長的說明文字，比容器還寬，所以要在容器裡換行而不是超出" />
    </div>,
  );
  expect(screen.getByRole('checkbox').getBoundingClientRect().width).toBeLessThanOrEqual(200);
});
