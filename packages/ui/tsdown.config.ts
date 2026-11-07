import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    // npm: ES module with types; React and Base UI stay external.
    // format: the React-free helpers, usable in server components; it shares one chunk (one locale) with index.
    entry: { index: 'src/index.ts', format: 'src/format-entry.ts' },
    format: 'esm',
    // neutral: keep process.env.NODE_ENV for the consumer's bundler to replace (browser would inline it as development).
    platform: 'neutral',
    target: 'es2022',
    dts: true,
    sourcemap: true,
    clean: true,
    external: [/^react($|\/)/, /^react-dom($|\/)/, /^@base-ui\//],
    // The components need the browser: frameworks with server components must treat index as client code.
    outputOptions: { banner: (chunk) => (chunk.name === 'index' ? "'use client';" : '') },
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
