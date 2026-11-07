import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
// The repo's own rules, from source (Node strips the types): templates are copied into projects, so they must pass.
import ui from './packages/eslint-plugin-ui/src/index.ts';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', 'site/**', 'labs/**', '**/*.html'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-var': 'error',
      'prefer-const': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  { ...ui.configs.recommended, files: ['packages/blocks/src/**/*.tsx', 'packages/ui/src/**/*.stories.tsx'] },
);
