import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Select } from '../../index';

test('an empty Select with an error: the warning icon sits at the right end beside the caret, not in the middle', () => {
  const { container } = render(
    <div style={{ width: 360 }}>
      <Select label="地區" options={[{ value: 'tw', label: '臺灣' }]} value="" onChange={() => {}} error="請選擇地區" />
    </div>,
  );
  const trigger = container.querySelector('.ui-select-trigger') as HTMLElement;
  const icon = trigger.querySelector('.ui-field-icon') as Element;
  const chev = trigger.querySelector('.ui-select-chev') as Element;
  const t = trigger.getBoundingClientRect();
  expect(t.right - icon.getBoundingClientRect().right).toBeLessThan(48);
  expect(chev.getBoundingClientRect().left - icon.getBoundingClientRect().right).toBeLessThanOrEqual(12);
});
