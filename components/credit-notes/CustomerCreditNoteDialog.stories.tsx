import type { Meta, StoryObj } from '@storybook/react-vite';
import { CustomerCreditNoteDialog } from './CustomerCreditNoteDialog';

const meta: Meta<typeof CustomerCreditNoteDialog> = {
  title: 'Modals/CustomerCreditNoteDialog',
  component: CustomerCreditNoteDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    customerId: 'cust_123',
    customerName: 'Juan Perez',
    onSuccess: () => {},
  },
};

export const WithPreselectedSale: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    customerId: 'cust_123',
    customerName: 'Juan Perez',
    onSuccess: () => {},
    preselectedSaleId: 'sale_456',
  },
};

export const Closed: Story = {
  args: {
    open: false,
    onOpenChange: () => {},
    customerId: 'cust_123',
    customerName: 'Juan Perez',
    onSuccess: () => {},
  },
};
