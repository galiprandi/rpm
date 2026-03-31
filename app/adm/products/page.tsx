'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductDialog } from '@/components/products/ProductDialog';
import { ProductMovementsModal } from '@/components/products/ProductMovementsModal';
import { useUI } from '@/components/ui/UIProvider';
import { CrudAdmin, StatItem } from '@/components/adm';
import { Package, Edit2, Trash2, AlertTriangle, DollarSign, Boxes, History } from 'lucide-react';
import { PriceDisplay } from '@/components/ui/price-display';
import { StockDisplay } from '@/components/ui/stock-display';
import { type ColumnDef } from '@tanstack/react-table';

import { type Product, type Category, type Supplier, type ProductFormData } from '@/components/products/types';

export default function ProductsPage() {
  const { alert, confirm } = useUI();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Movements modal state
  const [movementsModalOpen, setMovementsModalOpen] = useState(false);
  const [selectedProductForMovements, setSelectedProductForMovements] = useState<Product | null>(null);
  const [movements, setMovements] = useState<Array<{
    id: string;
    type: string;
    quantity: number;
    previousStock: number;
    newStock: number;
    reason: string;
    reasonDetails: string | null;
    userName: string | null;
    createdAt: string;
  }>>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  const openMovementsModal = async (product: Product) => {
    setSelectedProductForMovements(product);
    setMovementsModalOpen(true);
    setMovementsLoading(true);
    setMovements([]); // Clear previous movements
    try {
      const response = await fetch(`/api/products/${product.id}/movements`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMovements(data.movements || []);
    } catch (error) {
      console.error('Error fetching movements:', error);
      setMovements([]);
      await alert({
        title: 'Error',
        description: 'No se pudieron cargar los movimientos del producto',
        variant: 'error',
      });
    } finally {
      setMovementsLoading(false);
    }
  };

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

  const lowStockCount = products.filter((p) => p.isLowStock).length;
  const totalInventoryValue = products.reduce(
    (acc, p) => acc + p.costPrice * (p.stock || 0),
    0
  );

  const stats: StatItem[] = [
    {
      label: 'Total',
      value: products.length,
      icon: Boxes,
    },
    {
      label: 'Stock bajo',
      value: lowStockCount,
      icon: AlertTriangle,
      iconColor: lowStockCount > 0 ? '#ea580c' : undefined,
    },
    {
      label: 'Valor inventario',
      value: <PriceDisplay value={totalInventoryValue} />,
      icon: DollarSign,
    },
  ];

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.sku}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Producto',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            {row.original.description && (
              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'category.name',
        header: 'Categoría',
        cell: ({ row }) =>
          row.original.category ? (
            <Badge
              variant="secondary"
              style={{ backgroundColor: row.original.category.color || undefined }}
            >
              {row.original.category.name}
            </Badge>
          ) : (
            '-'
          ),
      },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: ({ row }) => (
          <StockDisplay stock={row.original.stock} minStock={row.original.minStock} />
        ),
      },
      {
        accessorKey: 'salePrice',
        header: 'Precio',
        cell: ({ row }) => (
          <span className="font-medium">
            <PriceDisplay value={row.original.salePrice} />
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Estado',
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge variant="default">Activo</Badge>
          ) : (
            <Badge variant="destructive">Inactivo</Badge>
          ),
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando productos...</div>
      </div>
    );
  }

  return (
    <>
      <CrudAdmin
        title="Productos"
        description="Gestiona el inventario de productos y servicios"
        items={products}
        loading={loading}
        onCreate={openCreateDialog}
        columns={columns}
        stats={stats}
        emptyIcon={<Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
        emptyMessage="No hay productos creados. Haz clic en 'Nuevo Producto' para crear el primero."
        createButtonText="Producto"
        tableTitle="Listado de Productos"
        searchPlaceholder="Buscar por SKU, nombre..."
        rowActions={(product) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openMovementsModal(product)}
              title="Ver historial"
            >
              <History className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)} title="Editar producto">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={() => handleDelete(product)}
              title="Eliminar producto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

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

      {/* Movements Modal */}
      <ProductMovementsModal
        isOpen={movementsModalOpen}
        onClose={() => setMovementsModalOpen(false)}
        product={selectedProductForMovements}
        movements={movements}
        loading={movementsLoading}
      />
    </>
  );
}
