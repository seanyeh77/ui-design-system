/* Which built-in icons a page has. Each icon is its own module (ph/<name>.ts): a component that always shows an icon
   (a caret, a close x) imports that module and calls includeIcons at load, so the icon renders at once in the browser.
   Any other name loads its module the first time an Icon shows it; until then the Icon is an empty box of the same
   size. A bundler then ships only the icons a page uses.
   Server render and hydration use only the icons the page preloaded (preloadIcons): which modules called includeIcons
   differs between a server that imports the whole package and a browser bundle that keeps only what the page uses, so
   those icons appear right after hydration instead. */
import { LOAD, PH_ALIAS, type IconName, type PhosphorName } from './names';
import type { IconGlyph } from './glyph';

/** Icons the page preloaded: the only ones in server renders and while hydrating, the same on both sides. */
const pinned = new Map<string, IconGlyph>();
/** Every icon the browser has: those included by modules and those loaded since. */
const ready = new Map<string, IconGlyph>();
/** Built-in markup to its name, so `d` given an icon's markup still finds its fill version. */
const byMarkup = new Map<string, string>();
const pending = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

function add(g: IconGlyph): boolean {
  if (ready.get(g.n) === g) return false;
  ready.set(g.n, g);
  byMarkup.set(g.r, g.n);
  byMarkup.set(g.f, g.n);
  return true;
}

const emit = () => listeners.forEach((fn) => fn());

/** Puts icons in the page's code: call at module load, never during a render. */
export function includeIcons(...glyphs: IconGlyph[]): void {
  let added = false;
  for (const g of glyphs) added = add(g) || added;
  if (added) emit();
}

export const isIconName = (s: string): s is IconName => Object.hasOwn(LOAD, s) || Object.hasOwn(PH_ALIAS, s);

/** The Phosphor name behind a name or an alias. */
export const phosphorName = (name: IconName): PhosphorName => (Object.hasOwn(LOAD, name) ? (name as PhosphorName) : PH_ALIAS[name as keyof typeof PH_ALIAS]);

/** The name behind the markup of a built-in icon the page has. */
export const nameOfMarkup = (markup: string): PhosphorName | undefined => byMarkup.get(markup) as PhosphorName | undefined;

/**
 * Gives the browser icons it then has at once, as if loaded: the `icons` export and the single-file bundle. Not used on
 * the server or while hydrating, so a server bundle that keeps `icons` and a browser bundle that drops it still render
 * the same markup.
 */
export function addLoadedIcons(glyphs: readonly IconGlyph[]): void {
  let added = false;
  for (const g of glyphs) added = add(g) || added;
  if (added) emit();
}

/** Loads one icon's module; resolves at once when the page has it. */
export function loadIcon(key: PhosphorName): Promise<void> {
  if (ready.has(key)) return Promise.resolve();
  let p = pending.get(key);
  if (!p) {
    p = LOAD[key]().then(
      (m) => {
        pending.delete(key);
        if (add(m.default)) emit();
      },
      (err: unknown) => {
        pending.delete(key);
        throw err;
      },
    );
    pending.set(key, p);
  }
  return p;
}

/**
 * Loads icons before they are shown, e.g. the icons above the fold before the first render, so they appear in the first
 * paint instead of a frame later. Preloaded icons are also the only ones in server renders: with server rendering, await
 * the same names on the server and in the browser before hydrating. Optional: every icon loads on its own the first time
 * it is shown.
 */
export function preloadIcons(names: Iterable<IconName>): Promise<void> {
  return Promise.all(
    [...names].filter(isIconName).map((n) => {
      const key = phosphorName(n);
      return loadIcon(key).then(() => {
        const g = ready.get(key);
        if (g) pinned.set(key, g);
      });
    }),
  ).then(() => undefined);
}

export function subscribeIcons(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** In the browser: every icon it has. */
export const readyGlyph = (key: string | undefined) => (key ? ready.get(key) : undefined);
/** On the server and while hydrating: only the preloaded icons, so both render the same markup. */
export const pinnedGlyph = (key: string | undefined) => (key ? pinned.get(key) : undefined);
