import type { Meta, StoryObj } from '@storybook/react';
import { ProductTable } from './ProductTable';

const meta: Meta<typeof ProductTable> = {
  title: 'Products/ProductTable',
  component: ProductTable,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const mockProducts = [
  {
    id: '1',
    sku: 'SKU001',
    name: 'Producto 1',
    description: 'Descripción del producto 1',
    costPrice: 100,
    salePrice: 150,
    stock: 50,
    minStock: 10,
    supplierId: '1',
    supplier: { id: '1', name: 'Proveedor 1' },
    barcode: '1234567890123',
    location: 'A1-B2',
    isActive: true,
    categoryId: '1',
    category: { id: '1', name: 'Categoría 1', color: '#FF0000' },
    margin: 50,
    isLowStock: false,
  },
  {
    id: '2',
    sku: 'SKU002',
    name: 'Producto 2',
    description: 'Descripción del producto 2',
    costPrice: 200,
    salePrice: 300,
    stock: 5,
    minStock: 10,
    supplierId: '2',
    supplier: { id: '2', name: 'Proveedor 2' },
    barcode: '9876543210987',
    location: 'C3-D4',
    isActive: true,
    categoryId: '2',
    category: { id: '2', name: 'Categoría 2', color: '#00FF00' },
    margin: 100,
    isLowStock: true,
  },
];

export const Default: Story = {
  args: {
    products: mockProducts,
    search: '',
    onSearchChange: () => {},
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const WithSearch: Story = {
  args: {
    products: mockProducts,
    search: 'Producto 1',
    onSearchChange: () => {},
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const Empty: Story = {
  args: {
    products: [],
    search: '',
    onSearchChange: () => {},
    onEdit: () => {},
    onDelete: () => {},
  },
};
