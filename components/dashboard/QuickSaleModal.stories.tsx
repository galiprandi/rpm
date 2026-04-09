import type { Meta, StoryObj } from '@storybook/react-vite';
import { QuickSaleModal } from './QuickSaleModal';

const meta: Meta<typeof QuickSaleModal> = {
  title: 'Modals/QuickSaleModal',
  component: QuickSaleModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Open modal
export const Open: Story = {
  args: {
    open: true,
    onOpenChange: (open) => console.log('Modal state:', open),
    onSuccess: () => console.log('Sale completed successfully'),
  },
};

// Closed modal (default)
export const Closed: Story = {
  args: {
    open: false,
    onOpenChange: (open) => console.log('Modal state:', open),
    onSuccess: () => console.log('Sale completed successfully'),
  },
};
