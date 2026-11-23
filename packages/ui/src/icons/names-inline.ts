/* names.ts for the single-file bundle (dist/bundle.js): every icon is already in the script, so a "load" resolves at
   once and the bundle carries no module per icon. tsdown.config.ts puts this file in place of names.ts there. */
import { ALL } from './all';
import type { LOAD as Loaders } from './names';

export { PH_ALIAS, type IconName, type PhosphorName } from './names';

export const LOAD = Object.fromEntries(ALL.map((g) => [g.n, () => Promise.resolve({ default: g })])) as unknown as typeof Loaders;
