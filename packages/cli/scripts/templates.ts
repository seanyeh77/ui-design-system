// Writes dist/templates.json: the page templates of registry.json (packages/blocks), with each file's content, for
// `ui add`. Run by the build after tsdown, so the CLI always carries the templates of its own commit and works without
// network access (the shadcn registry on the docs site serves the same files).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../../../', import.meta.url);
interface Item {
  name: string;
  title: string;
  description: string;
  dependencies?: string[];
  files: { path: string; target: string }[];
}
const registry = JSON.parse(readFileSync(new URL('registry.json', root), 'utf8')) as { items: Item[] };
const templates = registry.items.map((item) => ({
  name: item.name,
  title: item.title,
  description: item.description,
  dependencies: item.dependencies ?? [],
  files: item.files.map((f) => ({ target: f.target, content: readFileSync(new URL(f.path, root), 'utf8') })),
}));
mkdirSync(new URL('../dist/', import.meta.url), { recursive: true });
writeFileSync(new URL('../dist/templates.json', import.meta.url), JSON.stringify(templates, null, 1) + '\n');
console.log(`dist/templates.json: ${templates.map((t) => t.name).join(', ')}`);
