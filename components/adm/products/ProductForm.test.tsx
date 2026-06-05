import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductForm, ProductFormData } from '@/components/products/ProductForm';

// Mock Select component to avoid invalid HTML warnings and handle Radix primitives
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value, required }: any) => (
    <div data-testid="mock-select" data-value={value} data-aria-required={required}>
      <select
        data-testid="native-select-mock"
        onChange={(e) => onValueChange(e.target.value)}
        value={value}
        aria-label="mock-select"
      >
        <option value="">Select...</option>
        {/* Only render SelectItems as options to keep HTML valid */}
        {Array.isArray(children)
          ? children.map((child: any, i: number) =>
              child?.type?.name === 'SelectContent' ? child.props.children : null
            )
          : children?.type?.name === 'SelectContent' ? children.props.children : null
        }
      </select>
      {/* Render everything else (like SelectTrigger) outside the select to avoid warnings */}
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));

describe('ProductForm', () => {
  const mockSetFormData = vi.fn();
  
  const defaultFormData: ProductFormData = {
    barcode: '',
    sku: '',
    name: '',
    categoryId: '',
    supplierId: '',
    location: '',
    costPrice: '',
    replacementCost: '',
    stock: '',
    minStock: '',
    description: '',
  };

  const categories = [
    { id: 'cat-1', name: 'Iluminación' },
    { id: 'cat-2', name: 'Audio' },
  ];

  const suppliers = [
    { id: 'sup-1', name: 'Proveedor A' },
    { id: 'sup-2', name: 'Proveedor B' },
  ];

  beforeEach(() => {
    mockSetFormData.mockClear();
  });

  describe('Validation', () => {
    it('should mark required fields with an asterisk', () => {
      render(
        <ProductForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          categories={categories}
          suppliers={suppliers}
        />
      );
      
      expect(screen.getByText(/^Producto$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Categoría$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Proveedor$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Costo$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Costo de Reposición$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Stock$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Mínimo$/i)).toBeInTheDocument();
      
      // All these 7 fields are required
      expect(screen.getAllByText('*')).toHaveLength(7);
    });

    it('should use Select for category dropdown', () => {
      render(
        <ProductForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          categories={categories}
          suppliers={suppliers}
        />
      );
      
      const selects = screen.getAllByTestId('mock-select');
      expect(selects[0]).toHaveAttribute('data-aria-required', 'true');
    });

    it('should use Select for supplier dropdown', () => {
      render(
        <ProductForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          categories={categories}
          suppliers={suppliers}
        />
      );
      
      const selects = screen.getAllByTestId('mock-select');
      expect(selects[1]).toHaveAttribute('data-aria-required', 'true');
    });
  });

  describe('Form Interaction', () => {
    it('should update categoryId when category is selected', () => {
      render(
        <ProductForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          categories={categories}
          suppliers={suppliers}
        />
      );
      
      const selects = screen.getAllByTestId('native-select-mock');
      fireEvent.change(selects[0], { target: { value: 'cat-1' } });
      
      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 'cat-1' })
      );
    });

    it('should update supplierId when supplier is selected', () => {
      render(
        <ProductForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          categories={categories}
          suppliers={suppliers}
        />
      );
      
      const selects = screen.getAllByTestId('native-select-mock');
      fireEvent.change(selects[1], { target: { value: 'sup-1' } });
      
      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({ supplierId: 'sup-1' })
      );
    });
  });

  describe('Complete Form Data', () => {
    it('should render all required fields', () => {
      render(
        <ProductForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          categories={categories}
          suppliers={suppliers}
        />
      );
      
      // All required fields should be present
      expect(screen.getByLabelText(/^Producto/i)).toBeInTheDocument();
      // Labels for Selects
      expect(screen.getByText(/^Categoría$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Proveedor$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Costo\s*\*$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Costo de Reposición/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Stock\s*\*$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Mínimo\s*\*$/i)).toBeInTheDocument();
      
      // Optional fields
      expect(screen.getByLabelText(/Código de Barras/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/SKU/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ubicación/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Descripción/i)).toBeInTheDocument();
    });
  });
});
