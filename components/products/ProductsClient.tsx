'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductDialog } from '@/components/products/ProductDialog';
import { ProductMovementsModal } from '@/components/products/ProductMovementsModal';
import { ProductPricesModal } from '@/components/products/ProductPricesModal';
import { QuickSaleModal } from '@/components/dashboard/QuickSaleModal';
import { useUI } from '@/components/ui/UIProvider';
import { Header, CrudAdmin, StatItem } from '@/components/adm';
import { Edit2, Trash2, AlertTriangle, DollarSign, Boxes, Clock, ShoppingCart } from 'lucide-react';
import { PriceDisplay } from '@/components/ui/price-display';
import { StockDisplay } from '@/components/ui/stock-display';
import { type ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

import { type Product, type Category, type Supplier, type ProductFormData } from '@/components/products/types';

interface ProductsClientProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  lowStockCount: number;
  totalInventoryValue: number;
}

export function ProductsClient({
  products,
  categories,
  suppliers,
  lowStockCount,
  totalInventoryValue,
}: ProductsClientProps) {
  const { alert, confirm } = useUI();
  const router = useRouter();
  
  // Modal states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    name: '',
    description: '',
    costPrice: '',
    replacementCost: '',
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

  // Prices modal state
  const [pricesModalOpen, setPricesModalOpen] = useState(false);
  const [selectedProductForPrices, setSelectedProductForPrices] = useState<Product | null>(null);

  // Quick sale modal state
  const [quickSaleModalOpen, setQuickSaleModalOpen] = useState(false);
  const [isCashOpen, setIsCashOpen] = useState<boolean | null>(null);

  // Check cash status on mount
  useEffect(() => {
    const checkCashStatus = async () => {
      try {
        const res = await fetch('/api/cash/status');
        if (res.ok) {
          const data = await res.json();
          setIsCashOpen(data.status === 'OPEN');
        }
      } catch (error) {
        console.error('Error checking cash status:', error);
      }
    };
    checkCashStatus();
  }, []);

  const handleQuickSaleSuccess = () => {
    router.refresh();
  };

  const openMovementsModal = async (product: Product) => {
    setSelectedProductForMovements(product);
    setMovementsModalOpen(true);
    setMovementsLoading(true);
    setMovements([]);
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

  const openPricesModal = (product: Product) => {
    setSelectedProductForPrices(product);
    setPricesModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      costPrice: '',
      replacementCost: '',
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

  const goToImporter = () => {
    router.push('/adm/products/import');
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      costPrice: product.costPrice.toString(),
      replacementCost: product.replacementCost.toString(),
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
    
    const missingFields: string[] = [];
    if (!formData.name.trim()) missingFields.push('Nombre');
    if (!formData.categoryId) missingFields.push('Categoría');
    if (!formData.supplierId) missingFields.push('Proveedor');
    if (!formData.costPrice.trim()) missingFields.push('Costo');
    if (!formData.replacementCost.trim()) missingFields.push('Costo de Reposición');
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
      replacementCost: parseFloat(formData.replacementCost) || 0,
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
        router.refresh();
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

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.categoryId !== '' &&
      formData.supplierId !== '' &&
      formData.costPrice.trim() !== '' &&
      formData.replacementCost.trim() !== '' &&
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
        router.refresh();
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
  }, [alert, confirm, router]);

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

  const columns: ColumnDef<Product>[] = [
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
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="default">Activo</Badge>
        ) : (
          <Badge variant="destructive">Inactivo</Badge>
        ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Productos"
          description="Gestiona el inventario de productos y servicios"
          secondaryActions={[
            {
              label: 'Importar Productos',
              onClick: goToImporter,
              variant: 'outline' as const,
              icon: undefined,
            },
            {
              label: 'Venta Rápida',
              onClick: () => setQuickSaleModalOpen(true),
              variant: 'default' as const,
              icon: ShoppingCart,
              disabled: isCashOpen === false,
              title: isCashOpen === false ? 'Debe abrir la caja para realizar ventas' : undefined,
            },
          ]}
        />

        <CrudAdmin
          title=""
          description=""
          items={products}
          loading={false}
          onCreate={openCreateDialog}
          columns={columns}
          stats={stats}
          emptyIcon={<Boxes className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
          emptyMessage="No hay productos creados. Haz clic en 'Nuevo Producto' para crear el primero."
          createButtonText="Producto"
          tableTitle="Listado de Productos"
          searchPlaceholder="Buscar por SKU, nombre..."
          rowActions={(product: Product) => (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openPricesModal(product)}
                title="Ver precios"
              >
                <DollarSign className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openMovementsModal(product)}
                title="Ver historial"
              >
                <Clock className="h-4 w-4" />
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
      </div>

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

      <ProductPricesModal
        isOpen={pricesModalOpen}
        onClose={() => setPricesModalOpen(false)}
        product={selectedProductForPrices}
      />

      <ProductMovementsModal
        isOpen={movementsModalOpen}
        onClose={() => setMovementsModalOpen(false)}
        product={selectedProductForMovements}
        movements={movements}
        loading={movementsLoading}
      />

      <QuickSaleModal
        open={quickSaleModalOpen}
        onOpenChange={setQuickSaleModalOpen}
        onSuccess={handleQuickSaleSuccess}
      />
    </>
  );
}
