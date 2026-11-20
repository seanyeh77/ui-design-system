import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as React from 'react';
import { TimeControl } from '../../index';

function Demo() {
  const [r, setR] = React.useState(false);
  return <TimeControl time={new Date(2026, 10, 20, 16, 24)} replaying={r} onReplayChange={setR} onNow={() => setR(false)} status={r ? '回放中' : '即時'} />;
}

test('回放 becomes 停止回放; 回到現在 only while replaying', async () => {
  render(<Demo />);
  const user = userEvent.setup();
  expect(screen.getByText('16:24')).not.toBeNull();
  expect((screen.getByRole('button', { name: '回到現在' }) as HTMLButtonElement).disabled).toBe(true);
  await user.click(screen.getByRole('button', { name: '回放' }));
  expect(screen.getByRole('button', { name: '停止回放' })).not.toBeNull();
  await user.click(screen.getByRole('button', { name: '回到現在' }));
  expect(screen.getByRole('button', { name: '回放' })).not.toBeNull();
});
