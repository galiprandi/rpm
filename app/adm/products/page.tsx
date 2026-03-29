'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { ProductForm } from '@/components/products/ProductForm';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Edit2,
  Trash2,
  ArrowUpDown,
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  supplier: string | null;
  barcode: string | null;
  location: string | null;
  isActive: boolean;
  categoryId: string;
  category: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  margin: number;
  isLowStock: boolean;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

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
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    costPrice: '',
    salePrice: '',
    stock: '',
    minStock: '',
    categoryId: '',
    supplier: '',
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
      supplier: '',
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
      supplier: product.supplier || '',
      barcode: product.barcode || '',
      location: product.location || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
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
        alert(error.error || 'Error al guardar producto');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar producto');
    }
  };

  // Validación: CTA deshabilitado hasta completar campos obligatorios
  const isFormValid = () => {
    return (
      formData.barcode.trim() !== '' &&
      formData.name.trim() !== '' &&
      formData.categoryId !== '' &&
      formData.supplier.trim() !== '' &&
      formData.costPrice.trim() !== '' &&
      formData.salePrice.trim() !== '' &&
      formData.stock.trim() !== '' &&
      formData.minStock.trim() !== ''
    );
  };

  const formValid = isFormValid();

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Estás seguro de desactivar "${product.name}"?`)) return;

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al desactivar producto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al desactivar producto');
    }
  };

  const filteredProducts = products.filter(p => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || 
      p.barcode?.toLowerCase().includes(searchLower) ||
      p.name.toLowerCase().includes(searchLower) ||
      p.sku.toLowerCase().includes(searchLower);
    
    const matchesCategory = !selectedCategory || p.category?.id === selectedCategory;
    const matchesLowStock = !showLowStockOnly || p.isLowStock;
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = products.filter(p => p.isLowStock).length;

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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Productos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock Bajo
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {lowStockCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorías
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Inventario
            </CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código EAN, nombre o SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <Button
              variant={showLowStockOnly ? 'default' : 'outline'}
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Solo stock bajo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">EAN/Código</th>
                  <th className="text-left py-3 px-4 font-medium">Producto</th>
                  <th className="text-left py-3 px-4 font-medium">SKU</th>
                  <th className="text-left py-3 px-4 font-medium">Categoría</th>
                  <th className="text-right py-3 px-4 font-medium">Stock</th>
                  <th className="text-right py-3 px-4 font-medium">Precio Venta</th>
                  <th className="text-center py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        {product.barcode ? (
                          <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {product.barcode}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Sin EAN
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-muted-foreground">
                            {product.description.substring(0, 60)}...
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {product.sku}
                      </td>
                      <td className="py-3 px-4">
                        {product.category && (
                          <Badge 
                            variant="secondary"
                            style={{ backgroundColor: product.category.color || undefined }}
                          >
                            {product.category.name}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={product.isLowStock ? 'text-orange-600 font-medium' : ''}>
                          {product.stock}
                        </span>
                        {product.isLowStock && (
                          <span className="text-xs text-orange-600 block">
                            Mín: {product.minStock}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        ${product.salePrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(product)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Product Modal */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        description={editingProduct 
          ? 'Modifica los datos del producto existente.' 
          : 'Completa los datos para crear un nuevo producto.'}
        size="lg"
        footer={
          <ModalFooter
            onCancel={() => setIsDialogOpen(false)}
            onSave={handleSubmit}
            saveText={editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            disabled={!formValid}
          />
        }
      >
        <ProductForm 
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          isValid={formValid}
        />
      </Modal>
    </div>
  );
}
