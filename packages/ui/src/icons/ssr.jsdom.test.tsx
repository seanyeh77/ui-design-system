// Server render with the whole package imported, hydrated by a browser bundle that keeps only some modules: the server
// has every module's includeIcons, the browser only those of the modules it imports. The markup must still match.
import { expect, test, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

test('server render with every module, hydration with a subset: no mismatch, then the icons appear', async () => {
  // Server: the whole package, as a server that imports @seanyeh77/ui has it.
  const server = await import('../index');
  const { renderToString } = await import('react-dom/server');
  const serverReact = await import('react');
  const tree = (ui: { Button: typeof server.Button; Icon: typeof server.Icon }, h: typeof serverReact.createElement) =>
    h('div', null, h(ui.Button, { icon: 'gear' }, '設定'), h(ui.Icon, { name: 'magnifying-glass' }), h(ui.Icon, { name: 'globe' }));
  await server.preloadIcons(['globe']);
  const html = renderToString(tree(server, serverReact.createElement));

  // Browser: a fresh module graph with only Button and Icon, as a tree-shaken client bundle has it.
  vi.resetModules();
  const React = await import('react');
  const { hydrateRoot } = await import('react-dom/client');
  const { act } = await import('react');
  const { Button } = await import('../components/Button/Button');
  const { Icon } = await import('./Icon');
  const { preloadIcons } = await import('./store');
  await preloadIcons(['globe']);

  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.append(host);
  const svgs = () => [...host.querySelectorAll('svg')];
  // Preloaded on both sides: in the server markup. The others are empty boxes there.
  expect(svgs().map((s) => s.innerHTML === '')).toEqual([true, true, false]);

  const recoverable: unknown[] = [];
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  let root: ReturnType<typeof hydrateRoot> | undefined;
  await act(async () => {
    root = hydrateRoot(host, tree({ Button, Icon }, React.createElement), { onRecoverableError: (e) => recoverable.push(e) });
  });
  await vi.waitFor(() => expect(svgs().every((s) => s.innerHTML !== '')).toBe(true));
  expect(recoverable).toEqual([]);
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
  act(() => root?.unmount());
  host.remove();
});
