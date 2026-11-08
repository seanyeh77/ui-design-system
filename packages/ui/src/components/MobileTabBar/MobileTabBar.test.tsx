import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MobileTabBar } from '../../index';

test('each tab shows its name under the icon; the name is also its accessible name', () => {
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
  expect([...container.querySelectorAll('.ui-tabbar-label')].map((n) => n.textContent)).toEqual(['總覽', '架構', '檢查']);
  const current = screen.getByRole('button', { name: '架構' });
  expect(current.getAttribute('aria-current')).toBe('page');
  expect(current.hasAttribute('aria-label')).toBe(false);
});
