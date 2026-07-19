/**
 * ProductExportModal Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductExportModal } from './ProductExportModal';
import { type Product } from './types';

// Mock the dialog component to just render content directly if open
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ id, checked, onCheckedChange, onClick }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      onClick={onClick}
      data-testid={id}
    />
  ),
}));

describe('ProductExportModal', () => {
  const mockProducts: Product[] = [
    {
      id: '1',
      sku: 'SKU-001',
      name: 'Product A',
      description: 'Desc A',
      barcode: '12345',
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Cat A', color: null },
      costPrice: 100,
      replacementCost: 110,
      stock: 5,
      minStock: 2,
      supplierId: 'sup-1',
      supplier: { id: 'sup-1', name: 'Supplier A' },
      location: 'Loc A',
      isActive: true,
      margin: 10,
      isLowStock: false,
    },
  ];

  const onCloseMock = vi.fn();

  beforeEach(() => {
    onCloseMock.mockClear();
    // Clear URL and document anchors mocks if any
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:url'),
    });
  });

  it('renders modal with correct products count and columns options', () => {
    render(
      <ProductExportModal
        isOpen={true}
        onClose={onCloseMock}
        filteredProducts={mockProducts}
      />
    );

    expect(screen.getByText('1 producto a exportar')).toBeInTheDocument();
    expect(screen.getByText('SKU (Código)')).toBeInTheDocument();
    expect(screen.getByText('Costo ($)')).toBeInTheDocument();
  });

  it('selects and deselects all columns correctly', () => {
    render(
      <ProductExportModal
        isOpen={true}
        onClose={onCloseMock}
        filteredProducts={mockProducts}
      />
    );

    const deselectAllButton = screen.getByText('Deseleccionar todos');
    fireEvent.click(deselectAllButton);

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    checkboxes.forEach((cb) => {
      expect(cb.checked).toBe(false);
    });

    const selectAllButton = screen.getByText('Seleccionar todos');
    fireEvent.click(selectAllButton);

    checkboxes.forEach((cb) => {
      expect(cb.checked).toBe(true);
    });
  });

  it('calls download on export click and triggers onClose', () => {
    // Mock anchor element download flow
    const clickMock = vi.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: clickMock,
    };
    const originalCreateElement = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      if (tagName === 'a') return mockAnchor as any;
      return originalCreateElement.call(document, tagName, options);
    });

    render(
      <ProductExportModal
        isOpen={true}
        onClose={onCloseMock}
        filteredProducts={mockProducts}
      />
    );

    const exportButton = screen.getByText('Exportar CSV');
    fireEvent.click(exportButton);

    expect(clickMock).toHaveBeenCalled();
    expect(mockAnchor.download).toBe('productos_filtrados.csv');
    expect(mockAnchor.href).toBe('blob:url');
    expect(onCloseMock).toHaveBeenCalled();
  });
});
