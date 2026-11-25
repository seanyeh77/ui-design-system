/* ui add: writes a page template (dashboard, list-detail, settings, login) into a project, from the copy the CLI
   carries in dist/templates.json (written at build time from registry.json and packages/blocks). No network. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

export interface Template {
  name: string;
  title: string;
  description: string;
  dependencies: string[];
  files: { target: string; content: string }[];
}

/** The templates shipped with this CLI. */
export function loadTemplates(url = new URL('./templates.json', import.meta.url)): Template[] {
  return JSON.parse(readFileSync(url, 'utf8')) as Template[];
}

/**
 * Where a template goes when no folder is given: src/components/blocks/<name> in a project with a src folder (Vite,
 * Next.js with src), else components/blocks/<name> (the shadcn registry's target).
 */
export function defaultDir(name: string, cwd: string): string {
  return join(existsSync(join(cwd, 'src')) ? 'src' : '', 'components', 'blocks', name);
}

/**
 * Writes the template's files into dir, each under its file name (the files import each other by relative path).
 * Existing files are left alone unless force is set; returns what was written and what was skipped.
 */
export function writeTemplate(t: Template, dir: string, force: boolean): { written: string[]; skipped: string[] } {
  const written: string[] = [];
  const skipped: string[] = [];
  mkdirSync(dir, { recursive: true });
  for (const f of t.files) {
    const path = join(dir, basename(f.target));
    if (existsSync(path) && !force) {
      skipped.push(path);
      continue;
    }
    writeFileSync(path, f.content);
    written.push(path);
  }
  return { written, skipped };
}

/** The lines printed after ui add: what was written and how to use it. */
export function addReport(t: Template, dir: string, r: { written: string[]; skipped: string[] }, cwd: string): string[] {
  const rel = (p: string) => relative(cwd, p) || '.';
  const main = basename(t.files[0]?.target ?? '').replace(/\.tsx?$/, '');
  const lines = [`${t.title} (${t.name}) → ${rel(dir)}/`];
  for (const p of r.written) lines.push(`  wrote ${rel(p)}`);
  for (const p of r.skipped) lines.push(`  kept ${rel(p)} (exists; --force overwrites it)`);
  // The packages the template imports that the project does not list yet (dependencies or devDependencies).
  let listed: Record<string, string> = {};
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    listed = { ...pkg.devDependencies, ...pkg.dependencies };
  } catch {
    /* no package.json: every package is missing */
  }
  const deps = [...new Set([...t.dependencies, 'react', 'react-dom'])].filter((d) => !listed[d]);
  if (deps.length) lines.push(`Missing packages: npm i ${deps.join(' ')}`);
  const sample = t.files.find((f) => /(^|\/)sample\.ts$/.test(f.target));
  lines.push(
    `Use: render <${main} … /> from ${rel(join(dir, basename(t.files[0]?.target ?? '')))} with your data (its props are typed there${sample ? `; ${basename(sample.target)} has example data in their shape` : ''}).`,
  );
  return lines;
}
