import type { Meta, StoryObj } from '@storybook/react';
import { PublicLayout } from './PublicLayout';

const meta: Meta<typeof PublicLayout> = {
  title: 'Public/PublicLayout',
  component: PublicLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="text-white">
        <h1 className="text-2xl font-bold">Sample Content</h1>
        <p>This is sample content inside the PublicLayout</p>
      </div>
    ),
  },
};
