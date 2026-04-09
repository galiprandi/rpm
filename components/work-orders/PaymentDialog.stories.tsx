import type { Meta, StoryObj } from '@storybook/react-vite';
import { PaymentDialog } from './PaymentDialog';

const meta: Meta<typeof PaymentDialog> = {
  title: 'WorkOrders/PaymentDialog',
  component: PaymentDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Open dialog
export const Open: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Dialog closed'),
    workOrderId: 'wo-123',
    workOrderTotal: 150000,
    onPaymentRegistered: () => console.log('Payment registered successfully'),
  },
};

// Closed dialog
export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => console.log('Dialog closed'),
    workOrderId: 'wo-123',
    workOrderTotal: 150000,
    onPaymentRegistered: () => console.log('Payment registered successfully'),
  },
};

// With high total amount
export const HighAmount: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Dialog closed'),
    workOrderId: 'wo-456',
    workOrderTotal: 500000,
    onPaymentRegistered: () => console.log('Payment registered successfully'),
  },
};
