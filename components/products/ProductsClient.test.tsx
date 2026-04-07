/**
 * ProductsClient Component Tests
 *
 * Tests for ProductsClient interactividad y comportamiento
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductsClient } from './ProductsClient';
import { type Product, type Category, type Supplier } from '@/components/products/types';

// Mock de componentes
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/components/products/ProductDialog', () => ({
  ProductDialog: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div data-testid="product-dialog">ProductDialog</div> : null,
}));

vi.mock('@/components/products/ProductMovementsModal', () => ({
  ProductMovementsModal: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div data-testid="movements-modal">MovementsModal</div> : null,
}));

vi.mock('@/components/products/ProductPricesModal', () => ({
  ProductPricesModal: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div data-testid="prices-modal">PricesModal</div> : null,
}));

vi.mock('@/components/dashboard/QuickSaleModal', () => ({
  QuickSaleModal: ({ open }: { open: boolean }) => open ? <div data-testid="quick-sale-modal">QuickSaleModal</div> : null,
}));

vi.mock('@/components/ui/UIProvider', () => ({
  useUI: () => ({
    alert: vi.fn(),
    confirm: vi.fn(),
  }),
}));

vi.mock('@/components/adm', () => ({
  Header: ({ title, children }: { title: string; children?: React.ReactNode }) => <div><h1>{title}</h1>{children}</div>,
  CrudAdmin: ({ items, onCreate, rowActions }: { items: Product[]; onCreate: () => void; rowActions?: (item: Product) => React.ReactNode }) => (
    <div>
      <button onClick={onCreate}>Create</button>
      <div data-testid="crud-admin">
        {items.map((item: Product) => (
          <div key={item.id}>
            {item.name}
            {rowActions && rowActions(item)}
          </div>
        ))}
      </div>
    </div>
  ),
  StatItem: ({ label, value }: { label: string; value: React.ReactNode }) => <div>{label}: {value}</div>,
}));

vi.mock('@/components/ui/price-display', () => ({
  PriceDisplay: ({ value }: { value: number }) => <span>${value}</span>,
}));

vi.mock('@/components/ui/stock-display', () => ({
  StockDisplay: ({ stock }: { stock: number }) => <span>{stock}</span>,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

describe('ProductsClient', () => {
  const mockProducts: Product[] = [
    {
      id: '1',
      sku: 'PRD-001',
      name: 'Product 1',
      description: 'Description 1',
      barcode: '1234567890',
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Category 1', color: '#ff0000' },
      costPrice: 100,
      replacementCost: 150,
      stock: 10,
      minStock: 5,
      supplierId: 'sup-1',
      supplier: { id: 'sup-1', name: 'Supplier 1' },
      location: 'A1',
      isActive: true,
      margin: 50,
      isLowStock: false,
    },
  ];

  const mockCategories: Category[] = [
    { id: 'cat-1', name: 'Category 1', color: '#ff0000' },
  ];

  const mockSuppliers: Supplier[] = [
    { id: 'sup-1', name: 'Supplier 1' },
  ];

  it('should render products correctly', () => {
    render(
      <ProductsClient
        products={mockProducts}
        categories={mockCategories}
        suppliers={mockSuppliers}
        lowStockCount={0}
        totalInventoryValue={1000}
      />
    );

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByTestId('crud-admin')).toBeInTheDocument();
  });

  it('should render stats correctly', () => {
    render(
      <ProductsClient
        products={mockProducts}
        categories={mockCategories}
        suppliers={mockSuppliers}
        lowStockCount={1}
        totalInventoryValue={1000}
      />
    );

    expect(screen.getByText('Total: 1')).toBeInTheDocument();
    expect(screen.getByText('Stock bajo: 1')).toBeInTheDocument();
    expect(screen.getByText('Valor inventario: $1000')).toBeInTheDocument();
  });

  it('should handle empty products list', () => {
    render(
      <ProductsClient
        products={[]}
        categories={mockCategories}
        suppliers={mockSuppliers}
        lowStockCount={0}
        totalInventoryValue={0}
      />
    );

    expect(screen.getByText('Total: 0')).toBeInTheDocument();
  });

  it('should open ProductDialog when create button is clicked', () => {
    render(
      <ProductsClient
        products={mockProducts}
        categories={mockCategories}
        suppliers={mockSuppliers}
        lowStockCount={0}
        totalInventoryValue={1000}
      />
    );

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    expect(screen.getByTestId('product-dialog')).toBeInTheDocument();
  });

  it('should render Header component', () => {
    render(
      <ProductsClient
        products={mockProducts}
        categories={mockCategories}
        suppliers={mockSuppliers}
        lowStockCount={0}
        totalInventoryValue={1000}
      />
    );

    expect(screen.getByText('Productos')).toBeInTheDocument();
  });
});
