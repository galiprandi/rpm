import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-mcp'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../'),
      '@/admin': path.resolve(__dirname, '../components/adm'),
      '@/public': path.resolve(__dirname, '../components/public'),
    };
    
    // Define process.env for Storybook
    config.define = {
      ...config.define,
      'process.env': '{}',
      'process': '{}',
    };
    
    return config;
  },
};

export default config;
