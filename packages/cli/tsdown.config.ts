import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { cli: 'src/cli.ts' },
  format: 'esm',
  platform: 'node',
  target: 'node22',
  dts: false,
  clean: true,
  fixedExtension: false,
  deps: { neverBundle: ['playwright', 'pixelmatch', 'pngjs', 'axe-core', /^@seanyeh77\//] },
});
