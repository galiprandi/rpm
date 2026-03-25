import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Test/Basic',
  component: 'div',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <div className="p-4 bg-card border rounded">Test Component</div>,
};
