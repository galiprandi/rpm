'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2, AlertTriangle, Percent, DollarSign, Calculator } from 'lucide-react';
import { Header } from '@/components/adm/Header';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUI } from '@/components/ui/UIProvider';

interface PriceListItem {
  id: string;
  productId: string | null;
  productName?: string;
  productSku?: string;
  replacementCost?: number;
  overrideMarginPercentage: number | null;
  fixedPrice: number | null;
  finalPrice: number;
  actualMargin: number;
  isBelowMinimum: boolean;
}

interface PriceListDetail {
  id: string;
  name: string;
  isPublic: boolean;
  isActive: boolean;
  baseMarginPercentage: number;
  roundingRule: string;
  itemCount: number;
  items: PriceListItem[];
}

interface Product {
  id: string;
  name: string;
  sku?: string;
}

interface PriceListDetailClientProps {
  initialPriceList: PriceListDetail;
}

export default function PriceListDetailClient({ initialPriceList }: PriceListDetailClientProps) {
  const params = useParams();
  const priceListId = params.id as string;
  const { alert, confirm } = useUI();

  const [priceList, setPriceList] = useState<PriceListDetail>(initialPriceList);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [overrideMargin, setOverrideMargin] = useState<string>('');
  const [fixedPrice, setFixedPrice] = useState<string>('');

  const fetchPriceList = useCallback(async () => {
    try {
      const response = await fetch(`/api/price-lists/${priceListId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPriceList(data.priceList);
    } catch (error) {
      console.error('Error fetching price list:', error);
    } finally {
      setLoading(false);
    }
  }, [priceListId]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, []);

  const handleAddException = async () => {
    if (!selectedProduct) {
      await alert({
        title: 'Error',
        description: 'Selecciona un producto',
        variant: 'error',
      });
      return;
    }

    try {
      const response = await fetch(`/api/price-lists/${priceListId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct,
          overrideMarginPercentage: overrideMargin ? parseFloat(overrideMargin) : null,
          fixedPrice: fixedPrice ? parseFloat(fixedPrice) : null,
        }),
      });

      if (response.ok) {
        setIsAddModalOpen(false);
        setSelectedProduct('');
        setOverrideMargin('');
        setFixedPrice('');
        fetchPriceList();
      } else {
        const error = await response.json();
        await alert({
          title: 'Error',
          description: error.error || 'Error al agregar excepción',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error adding exception:', error);
    }
  };

  const handleDeleteException = async (itemId: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Excepción',
      description: '¿Eliminar esta excepción de precio?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/price-lists/${priceListId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPriceList();
      } else {
        const error = await response.json();
        await alert({
          title: 'Error',
          description: error.error || 'Error al eliminar excepción',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting exception:', error);
    }
  };

  const openAddModal = () => {
    fetchProducts();
    setIsAddModalOpen(true);
  };

  const getRoundingRuleLabel = (rule: string) => {
    const labels: Record<string, string> = {
      EXACT: 'Exacto',
      NEAREST_INTEGER: 'Entero',
      PSYCHOLOGICAL: 'Psicológico',
      SMART_HUNDREDS: 'Inteligente',
    };
    return labels[rule] || rule;
  };

  const columns: ColumnDef<PriceListItem>[] = [
    {
      accessorKey: 'productName',
      header: 'Producto',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.productName}</div>
          {row.original.productSku && (
            <div className="text-sm text-muted-foreground">{row.original.productSku}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'replacementCost',
      header: 'Costo Repo.',
      cell: ({ row }) => (
        <span>${row.original.replacementCost?.toFixed(2) ?? '-'}</span>
      ),
    },
    {
      accessorKey: 'overrideMarginPercentage',
      header: 'Margen Override',
      cell: ({ row }) =>
        row.original.overrideMarginPercentage !== null ? (
          <Badge variant="secondary">{row.original.overrideMarginPercentage}%</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: 'fixedPrice',
      header: 'Precio Fijo',
      cell: ({ row }) =>
        row.original.fixedPrice !== null ? (
          <Badge variant="default">${row.original.fixedPrice.toFixed(2)}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: 'finalPrice',
      header: 'Precio Final',
      cell: ({ row }) => (
        <span className="font-bold">${row.original.finalPrice.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: 'actualMargin',
      header: 'Margen Real',
      cell: ({ row }) => {
        const isLow = row.original.isBelowMinimum;
        return (
          <div className="flex items-center gap-2">
            <span className={isLow ? 'text-red-600 font-bold' : ''}>
              {row.original.actualMargin.toFixed(1)}%
            </span>
            {isLow && <AlertTriangle className="h-4 w-4 text-red-600" />}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600"
          onClick={() => handleDeleteException(row.original.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  if (!priceList) {
    return <div className="p-6">Lista de precios no encontrada</div>;
  }

  return (
    <div className="space-y-6">
      <Header
        title={priceList.name}
        description={`Margen base: ${priceList.baseMarginPercentage}% • Redondeo: ${getRoundingRuleLabel(priceList.roundingRule)}`}
        showBackButton
        primaryAction={{
          label: 'Agregar Excepción',
          onClick: openAddModal,
          icon: Plus,
        }}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Margen Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{priceList.baseMarginPercentage}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Excepciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{priceList.itemCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <Badge variant={priceList.isActive ? 'default' : 'destructive'}>
                {priceList.isActive ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Visibilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <Badge variant={priceList.isPublic ? 'default' : 'secondary'}>
                {priceList.isPublic ? 'Pública' : 'Privada'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exceptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Excepciones de Precio</CardTitle>
        </CardHeader>
        <CardContent>
          {priceList.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay excepciones. Haz clic en &quot;Agregar Excepción&quot; para crear una.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={priceList.items}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Exception Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Excepción de Precio</DialogTitle>
            <DialogDescription>
              Agrega una excepción de precio para un producto específico en esta lista de precios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Producto</Label>
              <select
                id="product"
                className="w-full p-2 border rounded-md"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">Selecciona un producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.sku ? `(${product.sku})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="overrideMargin">Margen Override (%)</Label>
              <Input
                id="overrideMargin"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={overrideMargin}
                onChange={(e) => setOverrideMargin(e.target.value)}
                placeholder="Dejar vacío para usar margen base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fixedPrice">Precio Fijo ($)</Label>
              <Input
                id="fixedPrice"
                type="number"
                min={0}
                step={0.01}
                value={fixedPrice}
                onChange={(e) => setFixedPrice(e.target.value)}
                placeholder="Dejar vacío para calcular automáticamente"
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Si defines un precio fijo, se usará ese valor. Si no, se calculará usando el margen override (o el margen base si no hay override).
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddException}>Agregar Excepción</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
