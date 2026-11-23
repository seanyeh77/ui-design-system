// Reads src/styles.css, the list of every style file in cascade order, for the build and the token check.
import { existsSync, readdirSync, readFileSync } from 'node:fs';

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

/**
 * The classes a selector list gives their own rules: the first class of each selector that is one compound (.ui-a,
 * .ui-a.is-on:hover, .ui-a:not(.ui-b)), not a class styled inside another (.ui-b .ui-a) or inside :is() and the like.
 */
export function subjectClasses(selectors: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let compound = '';
  let single = true;
  const flush = () => {
    const first = /^\.(ui-[\w-]+)/.exec(compound);
    if (single && first) out.push(first[1]);
    compound = '';
    single = true;
  };
  for (const ch of selectors.trim().replace(/\s*,\s*/g, ',')) {
    if (ch === '(' || ch === '[') depth++;
    if (depth === 0 && ch === ',') {
      flush();
      continue;
    }
    if (depth === 0 && /[\s>+~]/.test(ch)) single = false;
    // Only text outside parentheses counts: .ui-a:not(.ui-b) styles .ui-a.
    if (depth === 0) compound += ch;
    if (ch === ')' || ch === ']') depth--;
  }
  flush();
  return out;
}

export interface Dependency {
  /** The component whose styles are needed. */
  name: string;
  /** Why: a class it styles, or "renders <Name>" for an import. */
  why: string;
}

/** What a component's modules hold: their code (with that of the internal modules they use) and the components they render. */
export interface ComponentSource {
  code: string;
  renders: string[];
}

/**
 * The components whose CSS each component's file needs: those it renders and those that style a class its code writes
 * (the first file in src/styles.css with a top-level rule for that class alone owns it: .ui-a or .ui-a.is-on, not
 * .ui-b .ui-a;
 * a class a shared file owns needs nothing, as every page has the shared files). Class names in comments or passed to
 * querySelector, closest, matches or classList.contains are not rendered and do not count.
 */
export function componentDependencies(
  files: StyleFile[],
  read: (path: string) => string,
  source: (name: string) => ComponentSource,
  /** The components to list; by default those with a CSS file. */
  of?: string[],
): Map<string, Dependency[]> {
  const owner = new Map<string, string>();
  for (const f of files) {
    // Top-level rules only: one inside @media or @container adjusts a class, it does not give it its look.
    const css = read(f.path).replace(/\/\*[\s\S]*?\*\//g, '');
    let depth = 0;
    let prelude = '';
    for (const ch of css) {
      if (ch === '{') {
        if (depth === 0 && !prelude.trim().startsWith('@'))
          for (const c of subjectClasses(prelude)) if (!owner.has(c)) owner.set(c, f.part === 'component' ? f.name : '');
        depth++;
        prelude = '';
      } else if (ch === '}') {
        depth--;
        prelude = '';
      } else if (ch === ';') prelude = '';
      else prelude += ch;
    }
  }
  const names = new Set(files.filter((f) => f.part === 'component').map((f) => f.name));
  const out = new Map<string, Dependency[]>();
  for (const name of of ?? names) {
    const { code, renders } = source(name);
    const text = code
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')
      .replace(/\.(?:querySelector(?:All)?|closest|matches|contains)(?:<[^>]*>)?\(\s*(['"`])(?:(?!\1).)*\1/g, '');
    const deps = new Map<string, string>();
    for (const r of renders) if (names.has(r) && r !== name) deps.set(r, `renders ${r}`);
    for (const m of text.matchAll(/ui-[\w-]+/g)) {
      const o = owner.get(m[0]);
      if (o && o !== name && !deps.has(o)) deps.set(o, `uses .${m[0]}`);
    }
    out.set(
      name,
      [...deps].map(([n, why]) => ({ name: n, why })),
    );
  }
  return out;
}

/**
 * A component's modules (not its tests or stories), the modules they import that are not another component's main
 * module (internal/, icons/, another component's helper file), and the components with a CSS file they render.
 * Type-only imports do not count.
 */
export function componentSource(src: URL, name: string, hasCss: Set<string>): ComponentSource {
  const seen = new Set<string>();
  const renders = new Set<string>();
  let code = '';
  const visit = (file: URL) => {
    if (seen.has(file.href)) return;
    seen.add(file.href);
    const text = readFileSync(file, 'utf8');
    code += text + '\n';
    for (const m of text.matchAll(/^\s*(?:import|export)(\s+type)?\b[^;]*?from '(\.[^']+)'/gm)) {
      if (m[1]) continue;
      const base = new URL(m[2], file);
      const target = ['.tsx', '.ts'].map((ext) => new URL(base.href + ext)).find((u) => existsSync(u));
      if (!target) continue;
      const main = /\/components\/(\w+)\/\1\.tsx$/.exec(target.pathname)?.[1];
      if (main && main !== name && hasCss.has(main)) renders.add(main);
      else if (!main || main === name || !hasCss.has(main)) visit(target);
    }
  };
  const dir = new URL(`components/${name}/`, src);
  for (const n of readdirSync(dir)) if (/\.tsx?$/.test(n) && !/\.(test|stories)\./.test(n)) visit(new URL(n, dir));
  return { code, renders: [...renders] };
}
