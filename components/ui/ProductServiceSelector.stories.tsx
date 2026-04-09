import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductServiceSelector, SelectedItem } from './ProductServiceSelector';

const meta: Meta<typeof ProductServiceSelector> = {
  title: 'Forms/ProductServiceSelector',
  component: ProductServiceSelector,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const mockPriceLists = [
  { id: 'pl-1', name: 'Lista General', baseMarginPercentage: 40 },
  { id: 'pl-2', name: 'Mayorista', baseMarginPercentage: 25 },
  { id: 'pl-3', name: 'Distribuidor', baseMarginPercentage: 15 },
];

const mockCategories = [
  { id: 'cat-1', name: 'Filtros' },
  { id: 'cat-2', name: 'Aceites' },
  { id: 'cat-3', name: 'Repuestos' },
  { id: 'cat-4', name: 'Neumáticos' },
];

const mockInitialItems: SelectedItem[] = [
  {
    id: 'prod-1',
    type: 'product',
    name: 'Aceite 5W-30 Castrol',
    quantity: 2,
    unitPrice: 15500,
    originalPrice: 15500,
    isManualPrice: false,
    priceListId: 'pl-1',
    sku: 'ACEITE-5W30-001',
    stock: 50,
    categoryId: 'cat-2',
    categoryName: 'Aceites',
  },
  {
    id: 'serv-1',
    type: 'service',
    name: 'Cambio de aceite',
    quantity: 1,
    unitPrice: 8500,
    originalPrice: 8500,
    isManualPrice: true,
    priceListId: 'pl-1',
  },
];

// Default - Empty state
export const Default: Story = {
  args: {
    onSelectionChange: (items) => console.log('Selected items:', items),
  },
};

// With price list selector
export const WithPriceListSelector: Story = {
  args: {
    showPriceListSelector: true,
    priceLists: mockPriceLists,
    onSelectionChange: (items) => console.log('Selected items:', items),
  },
};

// With category filter
export const WithCategoryFilter: Story = {
  args: {
    showCategoryFilter: true,
    categories: mockCategories,
    onSelectionChange: (items) => console.log('Selected items:', items),
  },
};

// Full features - All selectors enabled
export const FullFeatures: Story = {
  args: {
    showPriceListSelector: true,
    showCategoryFilter: true,
    showQuickCreate: true,
    priceLists: mockPriceLists,
    categories: mockCategories,
    onSelectionChange: (items) => console.log('Selected items:', items),
    onQuickCreate: () => console.log('Quick create clicked'),
  },
};

// With initial items
export const WithInitialItems: Story = {
  args: {
    showPriceListSelector: true,
    showCategoryFilter: true,
    showQuickCreate: true,
    priceLists: mockPriceLists,
    categories: mockCategories,
    initialItems: mockInitialItems,
    defaultPriceListId: 'pl-1',
    onSelectionChange: (items) => console.log('Selected items:', items),
    onQuickCreate: () => console.log('Quick create clicked'),
  },
};

// Without selected table - parent handles display
export const WithoutSelectedTable: Story = {
  args: {
    showSelectedTable: false,
    showPriceListSelector: true,
    priceLists: mockPriceLists,
    onSelectionChange: (items) => console.log('Selected items:', items),
  },
};

// Work order use case
export const WorkOrderUseCase: Story = {
  args: {
    showPriceListSelector: true,
    showQuickCreate: true,
    priceLists: mockPriceLists,
    initialItems: mockInitialItems,
    defaultPriceListId: 'pl-1',
    onSelectionChange: (items) => console.log('Work order items:', items),
    onQuickCreate: () => console.log('Quick service clicked'),
  },
};

// Quick sale use case
export const QuickSaleUseCase: Story = {
  args: {
    showPriceListSelector: true,
    showCategoryFilter: true,
    showQuickCreate: true,
    priceLists: mockPriceLists,
    categories: mockCategories,
    onSelectionChange: (items) => console.log('Quick sale items:', items),
    onQuickCreate: () => console.log('Quick service clicked'),
  },
};
