import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MobileTabBar } from '../../index';

test('icons only: each tab is named by its aria-label, no text shows', () => {
  const { container } = render(
    <MobileTabBar
      value="graph"
      items={[
        { id: 'home', label: '總覽', icon: 'house' },
        { id: 'graph', label: '架構', icon: 'share-network' },
        { id: 'notes', label: '檢查', icon: 'check-square' },
      ]}
    />,
  );
  expect(container.querySelector('.ui-tabbar')?.textContent).toBe('');
  const current = screen.getByRole('button', { name: '架構' });
  expect(current.getAttribute('aria-current')).toBe('page');
  expect(current.getAttribute('aria-label')).toBe('架構');
});
