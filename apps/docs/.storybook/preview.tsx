import type { Preview } from '@storybook/react-vite';
import '@seanyeh77/tokens/fonts.css';
import '@seanyeh77/tokens/tokens.css';
import '../../../packages/ui/src/styles.css';
import './preview.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: '主題',
      toolbar: {
        title: '主題',
        icon: 'mirror',
        items: [
          { value: 'light', title: '淺色' },
          { value: 'dark', title: '深色' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      document.documentElement.setAttribute('data-theme', context.globals.theme ?? 'light');
      return <Story />;
    },
  ],
  parameters: {
    layout: 'padded',
    options: {
      storySort: {
        order: ['設計系統', 'Foundations', 'Actions', 'Forms', 'Data', 'Status', 'Feedback', 'Overlays', 'Navigation', 'Appearance', 'Pages', 'Blocks'],
      },
    },
    a11y: { test: 'error' },
  },
};
export default preview;
