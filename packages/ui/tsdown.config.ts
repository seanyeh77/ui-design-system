import { defineConfig } from 'tsdown';

/** Modules without React: no 'use client', so @seanyeh77/ui/format works in server code. */
const SERVER_SAFE = /\/src\/(format|format-entry|i18n)\.ts$/;

export default defineConfig([
  {
    // npm: ES modules with types, one file per source module (unbundle), so a bundler keeps only the components a
    // page imports. React and Base UI stay external.
    // format-entry (@seanyeh77/ui/format): the React-free helpers, usable in server components; index re-exports the same modules.
    entry: { index: 'src/index.ts', 'format-entry': 'src/format-entry.ts' },
    unbundle: true,
    format: 'esm',
    // neutral: keep process.env.NODE_ENV for the consumer's bundler to replace (browser would inline it as development).
    platform: 'neutral',
    target: 'es2022',
    dts: true,
    sourcemap: true,
    clean: true,
    external: [/^react($|\/)/, /^react-dom($|\/)/, /^@base-ui\//],
    // The components need the browser: frameworks with server components must treat every module but the format
    // helpers as client code.
    outputOptions: { banner: (chunk) => (chunk.moduleIds.every((id) => SERVER_SAFE.test(id)) ? '' : "'use client';") },
  },
  {
    // Pages without a build step: everything, React included, as window.UI.
    entry: { bundle: 'src/iife.ts' },
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    minify: true,
    sourcemap: true,
    clean: false,
    noExternal: [/.*/],
    define: { 'process.env.NODE_ENV': '"production"', __UI_DEV__: 'true' },
    outputOptions: { entryFileNames: '[name].js' },
  },
]);
