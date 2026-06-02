'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2, AlertTriangle, Percent, DollarSign, Calculator, Search } from 'lucide-react';
import { Header, StatItem, CrudStats } from '@/components/adm';
import { ModalBase, ModalBaseFooter } from '@/components/ui/ModalBase';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUI } from '@/components/ui/UIProvider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PriceDisplay } from '@/components/ui/price-display';

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
            <div className="text-xs font-mono text-muted-foreground">{row.original.productSku}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'replacementCost',
      header: 'Costo Repo.',
      cell: ({ row }) => (
        <PriceDisplay value={row.original.replacementCost ?? 0} />
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
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
            <PriceDisplay value={row.original.fixedPrice} />
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: 'finalPrice',
      header: 'Precio Final',
      cell: ({ row }) => (
        <div className="font-bold">
          <PriceDisplay value={row.original.finalPrice} />
        </div>
      ),
    },
    {
      accessorKey: 'actualMargin',
      header: 'Margen Real',
      cell: ({ row }) => {
        const isLow = row.original.isBelowMinimum;
        return (
          <div className="flex items-center gap-2">
            <span className={isLow ? 'text-orange-600 font-bold' : ''}>
              {row.original.actualMargin.toFixed(1)}%
            </span>
            {isLow && <AlertTriangle className="h-4 w-4 text-orange-500" />}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleDeleteException(row.original.id)}
              aria-label="Eliminar excepción"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Eliminar excepción</TooltipContent>
        </Tooltip>
      ),
    },
  ];

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  if (!priceList) {
    return <div className="p-6">Lista de precios no encontrada</div>;
  }

  const stats: StatItem[] = [
    {
      label: 'Margen Base',
      value: `${priceList.baseMarginPercentage}%`,
      icon: Percent,
    },
    {
      label: 'Redondeo',
      value: getRoundingRuleLabel(priceList.roundingRule),
      icon: Calculator,
    },
    {
      label: 'Excepciones',
      value: priceList.itemCount,
      icon: Search,
    },
    {
      label: 'Estado',
      value: priceList.isActive ? 'Activa' : 'Inactiva',
      icon: DollarSign,
      iconColor: priceList.isActive ? '#10b981' : '#ef4444',
    },
  ];

  return (
    <div className="space-y-6">
      <Header
        title={priceList.name}
        description="Gestiona excepciones y precios específicos para esta lista"
        showBackButton
        primaryAction={{
          label: 'Agregar Excepción',
          onClick: openAddModal,
          icon: Plus,
          ariaLabel: 'Agregar nueva excepción de precio',
        }}
      >
        <div className="mt-2">
          <CrudStats stats={stats} />
        </div>
      </Header>

      {/* Exceptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Excepciones de Precio</CardTitle>
            <Badge variant="outline">{priceList.items.length} ítems</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {priceList.items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Calculator className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No hay excepciones configuradas para esta lista.</p>
              <Button onClick={openAddModal} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Agregar primera excepción
              </Button>
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
      <ModalBase
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar Excepción de Precio"
        description="Define un margen específico o un precio fijo para un producto en esta lista."
        footer={
          <ModalBaseFooter
            onCancel={() => setIsAddModalOpen(false)}
            onSave={handleAddException}
            saveText="Agregar Excepción"
          />
        }
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="product" required>Producto</Label>
            <SearchableSelect
              apiUrl="/api/products"
              onSelect={(item) => setSelectedProduct(item.id)}
              placeholder="Buscar producto..."
              searchPlaceholder="Escribe el nombre o SKU..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="overrideMargin">Margen Override (%)</Label>
              <Input
                id="overrideMargin"
                type="number"
                min={0}
                step={0.1}
                value={overrideMargin}
                onChange={(e) => setOverrideMargin(e.target.value)}
                placeholder="Ej: 35"
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
                placeholder="Ej: 1500"
              />
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-orange-500" />
            <p>
              Si defines un <strong>precio fijo</strong>, este prevalecerá.
              De lo contrario, se usará el <strong>margen override</strong>.
              Si ambos están vacíos, se aplicará el margen base de la lista ({priceList.baseMarginPercentage}%).
            </p>
          </div>
        </div>
      </ModalBase>
    </div>
  );
}
