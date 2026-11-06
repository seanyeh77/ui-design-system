// Writes one docs page per component (its README above the live stories and the props table) and the guide pages.
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

const root = new URL('../../../', import.meta.url);
const components = new URL('packages/ui/src/components/', root);
const out = new URL('../src/generated/', import.meta.url);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const name of readdirSync(components)) {
  const story = new URL(`${name}/${name}.stories.tsx`, components);
  const readme = new URL(`${name}/README.md`, components);
  if (!existsSync(story) || !existsSync(readme)) continue;
  writeFileSync(
    new URL(`${name}.mdx`, out),
    `import { Meta, Markdown, Stories, ArgTypes } from '@storybook/addon-docs/blocks';
import * as S from '../../../../packages/ui/src/components/${name}/${name}.stories';
import readme from '../../../../packages/ui/src/components/${name}/README.md?raw';

<Meta of={S} />

<Markdown>{readme}</Markdown>

<Stories title="範例" />

## Props

<ArgTypes of={S} />
`,
  );
}

const guides: [string, string][] = [
  ['guidelines', '設計規則'],
  ['layout', '版面'],
  ['motion', '動畫'],
  ['decisions', '決策紀錄'],
];
for (const [file, title] of guides)
  writeFileSync(
    new URL(`${file}.mdx`, out),
    `import { Meta, Markdown } from '@storybook/addon-docs/blocks';
import md from '../../../../docs/${file}.md?raw';

<Meta title="設計系統/${title}" />

<Markdown>{md}</Markdown>
`,
  );
console.log('docs pages written');
