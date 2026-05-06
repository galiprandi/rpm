import type { Preview } from '@storybook/react-vite';
import React from 'react';
import '../app/globals.css';
import { TooltipProvider } from '../components/ui/tooltip';

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
      },
    },
  },
  decorators: [
    (Story) => (
      <TooltipProvider delayDuration={0}>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default preview;
