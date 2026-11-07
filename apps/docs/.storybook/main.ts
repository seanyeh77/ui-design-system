import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'node:url';

// Stories live next to each component in packages/ui; docs pages are generated from the READMEs (scripts/pages.ts).
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../../../packages/ui/src/**/*.stories.tsx', '../../../packages/blocks/src/**/*.stories.tsx'],
  framework: '@storybook/react-vite',
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  core: { disableTelemetry: true },
  // Blocks import @seanyeh77/ui by name: point it at the source so stories show the current code.
  viteFinal: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: { ...config.resolve?.alias, '@seanyeh77/ui': fileURLToPath(new URL('../../../packages/ui/src/index.ts', import.meta.url)) },
    },
  }),
};
export default config;
