import type { Meta, StoryObj } from '@storybook/react-vite';

const TestComponent = () => <div className="p-4 bg-card border rounded">Test Component</div>;

const meta: Meta<typeof TestComponent> = {
  title: 'Test/Basic',
  component: TestComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
