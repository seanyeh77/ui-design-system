// Reads src/styles.css, the list of every style file in cascade order, for the build and the token check.
import { readFileSync } from 'node:fs';

/** The layer every component rule sits in, and the order statement each built file starts with. */
export const LAYER = 'ui.components';
export const LAYER_ORDER = '@layer theme, base, ui, components, utilities;\n@layer ui.tokens, ui.components;';

/** Shared files that must come after the components in dist/css/ (end.css): they override component rules. */
const END = new Set(['table', 'utilities', 'touch', 'floating', 'focus']);

export interface StyleFile {
  /** Path from src/, e.g. components/Button/Button.css. */
  path: string;
  /** Component name, or the shared file's name. */
  name: string;
  /** Where the file goes in dist/css/: base.css, its own <Name>.css or end.css. */
  part: 'base' | 'component' | 'end';
}

export function styleFiles(): StyleFile[] {
  const manifest = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  return [...manifest.matchAll(/@import '\.\/([^']+)'/g)].map(([, path]) => {
    const shared = path.match(/^styles\/([\w-]+)\.css$/);
    if (shared) return { path, name: shared[1], part: END.has(shared[1]) ? 'end' : 'base' };
    const name = path.match(/^components\/(\w+)\/\1\.css$/)?.[1];
    if (!name) throw new Error(`src/styles.css: ${path} is neither styles/<name>.css nor components/<Name>/<Name>.css`);
    return { path, name, part: 'component' };
  });
}
