/**
 * ProductsClient Component Tests
 *
 * Tests for ProductsClient interactividad y comportamiento
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductsClient } from './ProductsClient';
import { type Product, type Category, type Supplier } from '@/components/products/types';
import { TooltipProvider } from '@/components/ui/tooltip';

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
  CrudAdmin: ({ items, onCreate, rowActions, columns }: { items: Product[]; onCreate: () => void; rowActions?: (item: Product) => React.ReactNode; columns: any[] }) => {
    return (
      <div>
        <button onClick={onCreate}>Create</button>
        <div data-testid="crud-admin">
          {items.map((item: Product) => {
            const nameColumn = columns.find((col) => col.accessorKey === 'name');
            const CellRenderer = nameColumn?.cell;
            return (
              <div key={item.id} data-testid={`product-row-${item.id}`}>
                {CellRenderer ? CellRenderer({ row: { original: item } }) : item.name}
                {rowActions && rowActions(item)}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
  CrudStats: ({ stats }: { stats: Array<{ label: string; value: React.ReactNode }> }) => (
    <div>
      {stats.map((stat, i) => (
        <div key={i}>{stat.label}: {stat.value}</div>
      ))}
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
      <TooltipProvider>
        <ProductsClient
          products={mockProducts}
          categories={mockCategories}
          suppliers={mockSuppliers}
        />
      </TooltipProvider>
    );

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByTestId('crud-admin')).toBeInTheDocument();
  });

  it('should render stats correctly', () => {
    render(
      <TooltipProvider>
        <ProductsClient
          products={mockProducts}
          categories={mockCategories}
          suppliers={mockSuppliers}
        />
      </TooltipProvider>
    );

    // Check that stats are rendered with flexible text matching
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
    expect(screen.getByText(/Stock bajo:/)).toBeInTheDocument();
    expect(screen.getByText(/Valor inventario:/)).toBeInTheDocument();
  });

  it('should handle empty products list', () => {
    render(
      <TooltipProvider>
        <ProductsClient
          products={[]}
          categories={mockCategories}
          suppliers={mockSuppliers}
        />
      </TooltipProvider>
    );

    expect(screen.getByText('Total: 0')).toBeInTheDocument();
  });

  it('should open ProductDialog when create button is clicked', () => {
    render(
      <TooltipProvider>
        <ProductsClient
          products={mockProducts}
          categories={mockCategories}
          suppliers={mockSuppliers}
        />
      </TooltipProvider>
    );

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    expect(screen.getByTestId('product-dialog')).toBeInTheDocument();
  });

  it('should render Header component', () => {
    render(
      <TooltipProvider>
        <ProductsClient
          products={mockProducts}
          categories={mockCategories}
          suppliers={mockSuppliers}
        />
      </TooltipProvider>
    );

    expect(screen.getByText('Productos')).toBeInTheDocument();
  });

  it('should render secondary line with SKU, Barcode, Location, and Supplier when all are present', () => {
    const customProducts: Product[] = [
      {
        id: 'test-id-1',
        sku: 'TEST-SKU-123',
        name: 'Test Product X',
        description: 'Test Desc',
        barcode: 'EAN-99999',
        categoryId: 'cat-1',
        category: { id: 'cat-1', name: 'Category 1', color: '#ff0000' },
        costPrice: 100,
        replacementCost: 150,
        stock: 10,
        minStock: 5,
        supplierId: 'sup-1',
        supplier: { id: 'sup-1', name: 'Super Supplier Inc' },
        location: 'Estanteria B3',
        isActive: true,
        margin: 50,
        isLowStock: false,
      },
    ];

    render(
      <TooltipProvider>
        <ProductsClient
          products={customProducts}
          categories={mockCategories}
          suppliers={mockSuppliers}
        />
      </TooltipProvider>
    );

    // Verify name
    expect(screen.getByText('Test Product X')).toBeInTheDocument();

    // Verify SKU
    expect(screen.getByText('TEST-SKU-123')).toBeInTheDocument();
    // Verify high-contrast classes on SKU
    const skuElement = screen.getByText('TEST-SKU-123');
    expect(skuElement).toHaveClass('text-neutral-950');
    expect(skuElement).toHaveClass('font-mono');

    // Verify barcode/EAN
    expect(screen.getByText('EAN EAN-99999')).toBeInTheDocument();

    // Verify location
    expect(screen.getByText(/Estanteria B3/)).toBeInTheDocument();

    // Verify supplier
    expect(screen.getByText('Super Supplier Inc')).toBeInTheDocument();
  });

  it('should only render SKU when other optional fields are missing', () => {
    const customProducts: Product[] = [
      {
        id: 'test-id-2',
        sku: 'JUST-SKU-456',
        name: 'Only SKU Product',
        description: null,
        barcode: null,
        categoryId: 'cat-1',
        category: null,
        costPrice: 10,
        replacementCost: 15,
        stock: 1,
        minStock: 0,
        supplierId: null,
        supplier: null,
        location: null,
        isActive: true,
        margin: 50,
        isLowStock: false,
      },
    ];

    render(
      <TooltipProvider>
        <ProductsClient
          products={customProducts}
          categories={mockCategories}
          suppliers={mockSuppliers}
        />
      </TooltipProvider>
    );

    expect(screen.getByText('Only SKU Product')).toBeInTheDocument();
    expect(screen.getByText('JUST-SKU-456')).toBeInTheDocument();
    expect(screen.queryByText(/EAN/)).toBeNull();
    expect(screen.queryByText(/📍/)).toBeNull();
  });
});
