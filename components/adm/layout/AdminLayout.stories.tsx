import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminLayout } from './AdminLayout';

const meta: Meta<typeof AdminLayout> = {
  title: 'Adm/AdminLayout',
  component: AdminLayout,
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
      <div className="p-6">
        <h1 className="text-2xl font-bold">Dashboard Content</h1>
        <p>This is sample content inside the AdminLayout</p>
      </div>
    ),
  },
};
