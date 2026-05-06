import React from 'react';
import type { Preview } from '@storybook/react-vite';
import { TooltipProvider } from '../components/ui/tooltip';
import '../app/globals.css';
import { TooltipProvider } from '../components/ui/tooltip';
import React from 'react';

const preview: Preview = {
  decorators: [
    (Story) =>
      React.createElement(
        TooltipProvider,
        { delayDuration: 0 },
        React.createElement(Story)
      ),
  ],
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
      },
    },
  },
};

export default preview;
