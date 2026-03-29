import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductDialog } from './ProductDialog';

const meta: Meta<typeof ProductDialog> = {
  title: 'Products/ProductDialog',
  component: ProductDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const mockFormData = {
  sku: 'SKU001',
  name: 'Producto 1',
  description: 'Descripción del producto 1',
  costPrice: '100',
  salePrice: '150',
  stock: '50',
  minStock: '10',
  categoryId: '1',
  supplierId: '1',
  barcode: '1234567890123',
  location: 'A1-B2',
};

const mockEditingProduct = {
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
};

const mockCategories = [
  { id: '1', name: 'Categoría 1', color: '#FF0000' },
  { id: '2', name: 'Categoría 2', color: '#00FF00' },
];

const mockSuppliers = [
  { id: '1', name: 'Proveedor 1' },
  { id: '2', name: 'Proveedor 2' },
];

export const CreateDialog: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    editingProduct: null,
    formData: mockFormData,
    setFormData: () => {},
    onSubmit: () => {},
    categories: mockCategories,
    suppliers: mockSuppliers,
    isValid: true,
  },
};

export const EditDialog: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    editingProduct: mockEditingProduct,
    formData: mockFormData,
    setFormData: () => {},
    onSubmit: () => {},
    categories: mockCategories,
    suppliers: mockSuppliers,
    isValid: true,
  },
};

export const InvalidForm: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    editingProduct: null,
    formData: {
      sku: '',
      name: '',
      description: '',
      costPrice: '',
      salePrice: '',
      stock: '',
      minStock: '',
      categoryId: '',
      supplierId: '',
      barcode: '',
      location: '',
    },
    setFormData: () => {},
    onSubmit: () => {},
    categories: mockCategories,
    suppliers: mockSuppliers,
    isValid: false,
  },
};
