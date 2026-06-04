import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductForm, ProductFormData } from '@/components/products/ProductForm';

// Mock the Select component from shadcn/ui
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, "aria-required": ariaRequired }: any) => (
    <div
      data-testid="mock-select"
      data-value={value}
      data-aria-required={ariaRequired}
      onClick={() => onValueChange?.('cat-1')}
    >
      {children}
    </div>
  ),
  SelectTrigger: ({ children, id }: any) => <div id={id}>{children}</div>,
  SelectValue: ({ placeholder }: any) => <div>{placeholder}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
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
      expect(screen.getByText(/^Reposición$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Stock$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Mínimo$/i)).toBeInTheDocument();
      
      // All these 7 fields are required
      expect(screen.getAllByText('*')).toHaveLength(7);
    });

    it('should render Select for category and supplier', () => {
      render(
        <ProductForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          categories={categories}
          suppliers={suppliers}
        />
      );
      
      expect(screen.getByText(/Selecciona categoría/i)).toBeInTheDocument();
      expect(screen.getByText(/Selecciona proveedor/i)).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update name when input changes', () => {
      render(
        <ProductForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          categories={categories}
          suppliers={suppliers}
        />
      );
      
      const nameInput = screen.getByLabelText(/^Producto/i);
      fireEvent.change(nameInput, { target: { value: 'New Product' } });
      
      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Product' })
      );
    });

    it('should update categoryId when category is selected', () => {
      render(
        <ProductForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          categories={categories}
          suppliers={suppliers}
        />
      );
      
      // Find the mocked select and click it (our mock calls onValueChange('cat-1'))
      const selects = screen.getAllByTestId('mock-select');
      const categorySelect = selects[0];
      fireEvent.click(categorySelect);
      
      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 'cat-1' })
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
      
      expect(screen.getByText(/^Producto$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Categoría$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Proveedor$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Costo$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Reposición$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Stock$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Mínimo$/i)).toBeInTheDocument();
      
      expect(screen.getByText(/Código de Barras/i)).toBeInTheDocument();
      expect(screen.getByText(/SKU/i)).toBeInTheDocument();
      expect(screen.getByText(/Ubicación/i)).toBeInTheDocument();
      expect(screen.getByText(/Descripción/i)).toBeInTheDocument();
    });
  });
});
