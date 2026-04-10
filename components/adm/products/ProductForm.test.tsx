import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductForm, ProductFormData } from '@/components/products/ProductForm';

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
    it('should mark name as required', () => {
      render(
        <ProductForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          categories={categories}
          suppliers={suppliers}
        />
      );
      
      const nameLabel = screen.getByText(/Producto \*/i);
      expect(nameLabel).toBeInTheDocument();
    });

    it('should mark category as required', () => {
      render(
        <ProductForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          categories={categories}
          suppliers={suppliers}
        />
      );
      
      const categoryLabel = screen.getByText(/Categoría \*/i);
      expect(categoryLabel).toBeInTheDocument();
    });

    it('should mark supplier as required', () => {
      render(
        <ProductForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          categories={categories}
          suppliers={suppliers}
        />
      );
      
      const supplierLabel = screen.getByText(/Proveedor \*/i);
      expect(supplierLabel).toBeInTheDocument();
    });

    it('should use NativeSelect for category dropdown', () => {
      render(
        <ProductForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          categories={categories}
          suppliers={suppliers}
        />
      );
      
      // NativeSelect renders a native <select> element
      const categorySelect = screen.getByLabelText(/Categoría/i);
      expect(categorySelect.tagName).toBe('SELECT');
    });

    it('should use NativeSelect for supplier dropdown', () => {
      render(
        <ProductForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          categories={categories}
          suppliers={suppliers}
        />
      );
      
      const supplierSelect = screen.getByLabelText(/Proveedor/i);
      expect(supplierSelect.tagName).toBe('SELECT');
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
      
      const categorySelect = screen.getByLabelText(/Categoría/i);
      fireEvent.change(categorySelect, { target: { value: 'cat-1' } });
      
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
      
      const supplierSelect = screen.getByLabelText(/Proveedor/i);
      fireEvent.change(supplierSelect, { target: { value: 'sup-1' } });
      
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
      expect(screen.getByLabelText(/Producto/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Categoría/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Proveedor/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Costo \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Costo de Reposición/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Stock \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Mínimo/i)).toBeInTheDocument();
      
      // Optional fields
      expect(screen.getByLabelText(/Código de Barras/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/SKU/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ubicación/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Descripción/i)).toBeInTheDocument();
    });
  });
});
