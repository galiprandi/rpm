import type { Preview } from '@storybook/react';
import '../app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    darkMode: {
      current: 'dark',
      darkClass: 'dark',
      lightClass: 'light',
      stylePreview: true,
    },
  },
  globalTypes: {
    darkMode: {
      description: 'Dark mode',
      defaultValue: 'dark',
      toolbar: {
        title: 'Dark mode',
        icon: 'moon',
        items: ['light', 'dark'],
        dynamicTitle: true,
        showName: true,
      },
    },
  },
};

export default preview;
