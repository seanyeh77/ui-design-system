import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: 'esm',
  platform: 'node',
  target: 'node22',
  dts: true,
  clean: true,
  fixedExtension: false,
  // The TSX parser (@typescript-eslint/parser with the TypeScript 6 API it needs) is bundled in: as a dependency it
  // would ask for a `typescript` peer older than 6.1, which a TypeScript 7 project cannot give (npm stops with
  // ERESOLVE), and the TypeScript 6 package it pulls in would take over the project's `tsc` command. Bundled, the
  // plugin depends on nothing but ESLint and works next to any TypeScript version. shims: TypeScript reads __filename.
  minify: true,
  shims: true,
  deps: { neverBundle: ['eslint'], alwaysBundle: [/.*/] },
});
