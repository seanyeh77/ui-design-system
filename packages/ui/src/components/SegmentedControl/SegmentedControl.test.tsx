import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as React from 'react';
import { SegmentedControl } from '../../index';

function Demo({ iconOnly }: { iconOnly?: boolean }) {
  const [v, setV] = React.useState<'preview' | 'source'>('preview');
  return (
    <SegmentedControl
      label="顯示方式"
      iconOnly={iconOnly}
      value={v}
      onChange={setV}
      items={[
        { id: 'preview', label: '預覽', icon: 'eye' },
        { id: 'source', label: '原始碼', icon: 'file-code' },
      ]}
    />
  );
}

test('a radio group: one Tab stop, ← → move and pick, icons named by their label', async () => {
  render(<Demo iconOnly />);
  const group = screen.getByRole('radiogroup', { name: '顯示方式' });
  const [a, b] = screen.getAllByRole('radio');
  expect(a.getAttribute('aria-checked')).toBe('true');
  expect(b.getAttribute('aria-label')).toBe('原始碼');
  expect(group.offsetHeight).toBe(28);
  const user = userEvent.setup();
  await user.tab();
  expect(document.activeElement).toBe(a);
  await user.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(b);
  expect(b.getAttribute('aria-checked')).toBe('true');
  await user.tab();
  expect(group.contains(document.activeElement)).toBe(false);
});

test('with words: the label is shown, a click picks', async () => {
  render(<Demo />);
  await userEvent.setup().click(screen.getByRole('radio', { name: '原始碼' }));
  expect(screen.getByRole('radio', { name: '原始碼' }).getAttribute('aria-checked')).toBe('true');
});
