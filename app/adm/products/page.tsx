'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductStats } from '@/components/products/ProductStats';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductDialog } from '@/components/products/ProductDialog';
import { useUI } from '@/components/ui/UIProvider';
import { Plus } from 'lucide-react';

import { type Product, type Category, type Supplier, type ProductFormData } from '@/components/products/types';

export default function ProductsPage() {
  const { alert, confirm } = useUI();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      const data = await response.json();
      if (data.suppliers) {
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
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
  });

  const resetForm = () => {
    setFormData({
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
    });
    setEditingProduct(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      costPrice: product.costPrice.toString(),
      salePrice: product.salePrice.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      categoryId: product.categoryId,
      supplierId: product.supplierId || '',
      barcode: product.barcode || '',
      location: product.location || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Validate before submitting
    const missingFields: string[] = [];
    if (!formData.name.trim()) missingFields.push('Nombre');
    if (!formData.categoryId) missingFields.push('Categoría');
    if (!formData.supplierId) missingFields.push('Proveedor');
    if (!formData.costPrice.trim()) missingFields.push('Costo');
    if (!formData.salePrice.trim()) missingFields.push('Venta');
    if (!formData.stock.trim()) missingFields.push('Stock');
    if (!formData.minStock.trim()) missingFields.push('Mínimo');
    
    if (missingFields.length > 0) {
      await alert({
        title: 'Error',
        description: `Campos obligatorios faltantes: ${missingFields.join(', ')}`,
        variant: 'error',
      });
      return;
    }
    
    const payload = {
      ...formData,
      costPrice: parseFloat(formData.costPrice) || 0,
      salePrice: parseFloat(formData.salePrice) || 0,
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 0,
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        fetchProducts();
      } else {
        const error = await response.json();
        await alert({
          title: 'Error',
          description: error.error || 'Error al guardar producto',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      await alert({
        title: 'Error',
        description: 'Error al guardar producto',
        variant: 'error',
      });
    }
  };

  // Validación: CTA deshabilitado hasta completar campos obligatorios
  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.categoryId !== '' &&
      formData.supplierId !== '' &&
      formData.costPrice.trim() !== '' &&
      formData.salePrice.trim() !== '' &&
      formData.stock.trim() !== '' &&
      formData.minStock.trim() !== ''
    );
  };

  const formValid = isFormValid();

  const handleDelete = useCallback(async (product: Product) => {
    const confirmed = await confirm({
      title: 'Desactivar Producto',
      description: `¿Estás seguro de desactivar "${product.name}"?`,
      confirmText: 'Desactivar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const error = await response.json();
        await alert({
          title: 'Error',
          description: error.error || 'Error al desactivar producto',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      await alert({
        title: 'Error',
        description: 'Error al desactivar producto',
        variant: 'error',
      });
    }
  }, [alert, confirm]);

  const filteredProducts = products.filter(p => {
    const searchLower = search.toLowerCase();
    return !search || 
      p.barcode?.toLowerCase().includes(searchLower) ||
      p.name.toLowerCase().includes(searchLower) ||
      p.sku.toLowerCase().includes(searchLower);
  });

  const handleEditProduct = (product: Product) => {
    openEditDialog(product);
  };

  const handleDeleteProduct = (product: Product) => {
    handleDelete(product);
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Productos</h1>
          <p className="text-muted-foreground">
            Gestiona el inventario de productos y servicios
          </p>
        </div>
        <Button 
          onClick={openCreateDialog}
          variant="default"
          className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold px-4 py-2"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Stats Cards */}
      <ProductStats products={products} categories={categories} />

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductTable
            products={filteredProducts}
            search={search}
            onSearchChange={setSearch}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        </CardContent>
      </Card>
      {/* Product Modal */}
      <ProductDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        categories={categories}
        suppliers={suppliers}
        isValid={formValid}
      />
    </div>
  );
}
