import * as React from 'react';
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { LayerGraph, type LayerGraphEdge } from '../../index';

const user = userEvent.setup();
const nodes = [
  { id: 'ibmon', name: 'src/ibmon', layer: 0, size: 91 },
  { id: 'cli', name: 'src/cli', layer: 0, size: 18 },
  { id: 'lib', name: 'src/libibtrace', layer: 1, size: 114 },
];
const edges: LayerGraphEdge[] = [
  { id: 'shm', from: 'ibmon', to: 'lib', inferred: true, label: '環境變數 `IBTRACE_SHM`' },
  { from: 'cli', to: 'lib', count: 7 },
];

function Demo({ onEdge, onBox }: { onEdge: (id: string | null) => void; onBox: (id: string | null) => void }) {
  const [box, setBox] = React.useState<string | null>(null);
  const [edge, setEdge] = React.useState<string | null>(null);
  return (
    <LayerGraph
      nodes={nodes}
      edges={edges}
      selected={box}
      onSelect={(id) => {
        onBox(id);
        setBox(id);
      }}
      selectedEdge={edge}
      onSelectEdge={(id) => {
        onEdge(id);
        setEdge(id);
      }}
      legend={false}
    />
  );
}

test('LayerGraph: without onSelectEdge, lines are not buttons', () => {
  render(<LayerGraph nodes={nodes} edges={edges} />);
  expect(screen.queryByRole('button', { name: /→/ })).toBeNull();
});

test('LayerGraph: clicking a line selects it, again clears it; the label works too', async () => {
  const onEdge = vi.fn();
  render(<Demo onEdge={onEdge} onBox={() => {}} />);
  const line = screen.getByRole('button', { name: 'src/cli → src/libibtrace，7 次' });
  await user.click(line);
  expect(onEdge).toHaveBeenLastCalledWith('cli->lib');
  expect(line.getAttribute('aria-pressed')).toBe('true');
  await user.click(line);
  expect(onEdge).toHaveBeenLastCalledWith(null);
  await user.click(screen.getByText('IBTRACE_SHM'));
  expect(onEdge).toHaveBeenLastCalledWith('shm');
  expect(screen.getByRole('button', { name: 'src/ibmon → src/libibtrace，環境變數 `IBTRACE_SHM`' }).getAttribute('aria-pressed')).toBe('true');
});

test('LayerGraph: a line and a box are never selected together', async () => {
  const onEdge = vi.fn();
  const onBox = vi.fn();
  render(<Demo onEdge={onEdge} onBox={onBox} />);
  await user.click(screen.getByRole('button', { name: /^src\/cli 18/ }));
  expect(onBox).toHaveBeenLastCalledWith('cli');
  await user.click(screen.getByRole('button', { name: 'src/cli → src/libibtrace，7 次' }));
  expect(onBox).toHaveBeenLastCalledWith(null);
  expect(onEdge).toHaveBeenLastCalledWith('cli->lib');
  await user.click(screen.getByRole('button', { name: /^src\/ibmon 91/ }));
  expect(onEdge).toHaveBeenLastCalledWith(null);
  expect(onBox).toHaveBeenLastCalledWith('ibmon');
});

test('LayerGraph: Tab reaches the lines after the boxes; Enter selects, Escape clears', async () => {
  const onEdge = vi.fn();
  render(<Demo onEdge={onEdge} onBox={() => {}} />);
  for (let k = 0; k < 4; k++) await user.tab();
  expect(document.activeElement?.getAttribute('aria-label')).toBe('src/ibmon → src/libibtrace，環境變數 `IBTRACE_SHM`');
  await user.keyboard('{Enter}');
  expect(onEdge).toHaveBeenLastCalledWith('shm');
  await user.keyboard('{Escape}');
  expect(onEdge).toHaveBeenLastCalledWith(null);
  await user.tab();
  await user.keyboard(' ');
  expect(onEdge).toHaveBeenLastCalledWith('cli->lib');
});

test('LayerGraph: a click on the empty diagram clears the selected line', async () => {
  const onEdge = vi.fn();
  const { container } = render(<Demo onEdge={onEdge} onBox={() => {}} />);
  await user.click(screen.getByRole('button', { name: 'src/cli → src/libibtrace，7 次' }));
  const canvas = container.querySelector<HTMLElement>('.ui-lg-canvas');
  if (!canvas) throw new Error('no canvas');
  await user.pointer({
    keys: '[MouseLeft]',
    target: canvas,
    coords: { x: canvas.getBoundingClientRect().left + 2, y: canvas.getBoundingClientRect().top + 2 },
  });
  expect(onEdge).toHaveBeenLastCalledWith(null);
});
