'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUI } from '@/components/ui/UIProvider';
import { PriceListDialog } from '@/components/price-lists/PriceListDialog';
import { CostUpdateDialog } from '@/components/cost-updates/CostUpdateDialog';
import { ProductAuditModal } from '@/components/products/ProductAuditModal';
import { type PriceListFormData } from '@/components/price-lists/PriceListForm';
import { Header, CrudAdmin, StatItem, CrudStats } from '@/components/adm';
import { DollarSign, Pencil, Trash2, List, Percent, Layers, TrendingUp, History, Plus } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PriceList {
  id: string;
  name: string;
  isPublic: boolean;
  isActive: boolean;
  baseMarginPercentage: number;
  roundingRule: string;
  itemCount: number;
}

interface PriceListsClientProps {
  initialPriceLists: PriceList[];
}

export default function PriceListsClient({ initialPriceLists }: PriceListsClientProps) {
  const { alert, confirm } = useUI();
  const [priceLists, setPriceLists] = useState<PriceList[]>(initialPriceLists);
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState<PriceListFormData>({
    name: '',
    baseMarginPercentage: 40,
    roundingRule: 'SMART_HUNDREDS',
    isPublic: false,
    isActive: true,
  });
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCostUpdateDialogOpen, setIsCostUpdateDialogOpen] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [editForm, setEditForm] = useState<PriceListFormData>({
    name: '',
    baseMarginPercentage: 40,
    roundingRule: 'SMART_HUNDREDS',
    isPublic: false,
    isActive: true,
  });

  const fetchPriceLists = async () => {
    try {
      const response = await fetch('/api/price-lists?includeInactive=true');
      const data = await response.json();
      if (response.ok && data.priceLists) {
        setPriceLists(data.priceLists);
      } else {
        setPriceLists([]);
        if (!response.ok) {
          console.error('API error:', data.error || 'Unknown error');
        }
      }
    } catch (error) {
      console.error('Error fetching price lists:', error);
      setPriceLists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePriceList = async () => {
    if (!createForm.name.trim()) return;

    try {
      const response = await fetch('/api/price-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        setCreateForm({
          name: '',
          baseMarginPercentage: 40,
          roundingRule: 'SMART_HUNDREDS',
          isPublic: false,
          isActive: true,
        });
        setIsCreateDialogOpen(false);
        fetchPriceLists();
      } else {
        const error = await response.json();
        await alert({
          title: 'Error',
          description: error.error || 'Error al crear lista de precios',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error creating price list:', error);
    }
  };

  const handleDeletePriceList = async (priceList: PriceList) => {
    const confirmed = await confirm({
      title: 'Eliminar Lista de Precios',
      description: `Eliminar permanentemente "${priceList.name}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/price-lists/${priceList.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPriceLists();
      } else {
        const error = await response.json();
        await alert({
          title: 'Error',
          description: error.error || 'Error al eliminar lista',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting price list:', error);
    }
  };

  const openEditDialog = (priceList: PriceList) => {
    setEditingPriceList(priceList);
    setEditForm({
      name: priceList.name,
      baseMarginPercentage: priceList.baseMarginPercentage,
      roundingRule: priceList.roundingRule as PriceListFormData['roundingRule'],
      isPublic: priceList.isPublic,
      isActive: priceList.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleEditSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingPriceList) return;

    try {
      const response = await fetch(`/api/price-lists/${editingPriceList.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setEditingPriceList(null);
        fetchPriceLists();
      } else {
        const error = await response.json();
        await alert({
          title: 'Error',
          description: error.error || 'Error al actualizar lista',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating price list:', error);
    }
  };

  const stats: StatItem[] = [
    {
      label: 'Total',
      value: priceLists.length,
      icon: Layers,
    },
    {
      label: 'Activas',
      value: priceLists.filter((pl) => pl.isActive).length,
      icon: List,
      iconColor: '#10b981',
    },
    {
      label: 'Excepciones',
      value: priceLists.reduce((acc, pl) => acc + pl.itemCount, 0),
      icon: Percent,
    },
  ];

  const getRoundingRuleLabel = (rule: string) => {
    const labels: Record<string, string> = {
      EXACT: 'Exacto',
      NEAREST_INTEGER: 'Entero',
      PSYCHOLOGICAL: 'Psicológico',
      SMART_HUNDREDS: 'Inteligente',
    };
    return labels[rule] || rule;
  };

  const columns = useMemo<ColumnDef<PriceList>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
              <DollarSign className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <Link
              href={`/adm/price-lists/${row.original.id}`}
              className="font-semibold tracking-tight hover:underline text-primary"
            >
              {row.original.name}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: 'baseMarginPercentage',
        header: 'Margen Base',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.baseMarginPercentage}%</Badge>
        ),
      },
      {
        accessorKey: 'roundingRule',
        header: 'Redondeo',
        cell: ({ row }) => (
          <Badge variant="outline">{getRoundingRuleLabel(row.original.roundingRule)}</Badge>
        ),
      },
      {
        accessorKey: 'itemCount',
        header: 'Excepciones',
        cell: ({ row }) => <span>{row.original.itemCount}</span>,
      },
      {
        accessorKey: 'isPublic',
        header: 'Visibilidad',
        cell: ({ row }) =>
          row.original.isPublic ? (
            <Badge variant="default">Pública</Badge>
          ) : (
            <Badge variant="secondary">Privada</Badge>
          ),
      },
      {
        accessorKey: 'isActive',
        header: 'Estado',
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge
              variant="outline"
              className="text-emerald-600 border-emerald-200 bg-emerald-50"
            >
              Activa
            </Badge>
          ) : (
            <Badge variant="secondary">Inactiva</Badge>
          ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <Header
        title="Precios"
        description="Gestiona listas de precios y excepciones"
        primaryAction={{
          label: 'Nueva Lista',
          onClick: () => setIsCreateDialogOpen(true),
          icon: Plus,
          ariaLabel: 'Crear nueva lista de precios',
        }}
        secondaryActions={[
          {
            label: 'Actualizar Costos',
            onClick: () => setIsCostUpdateDialogOpen(true),
            variant: 'outline',
            icon: TrendingUp,
            ariaLabel: 'Ir a actualización de costos',
          },
          {
            label: 'Historial',
            onClick: () => setShowAuditModal(true),
            variant: 'outline',
            icon: History,
            ariaLabel: 'Ver historial de auditoría',
          },
        ]}
      />

      <CrudStats stats={stats} />

      <CrudAdmin
        items={priceLists}
        loading={loading}
        columns={columns}
        hideCreateAction
        emptyIcon={<List className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
        emptyMessage="No hay listas de precios creadas. Haz clic en 'Nueva Lista' para crear la primera."
        createButtonText="Lista"
        tableTitle="Listado de Listas de Precios"
        searchPlaceholder="Buscar listas..."
        rowActions={(priceList) => (
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(priceList)}
                  aria-label="Editar lista"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar lista</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDeletePriceList(priceList)}
                  aria-label="Eliminar lista"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eliminar lista</TooltipContent>
            </Tooltip>
          </div>
        )}
      />

      {/* Edit Price List Dialog */}
      <PriceListDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        editingPriceList={editingPriceList}
        formData={editForm}
        setFormData={setEditForm}
        onSubmit={handleEditSubmit}
      />

      {/* Create Price List Dialog */}
      <PriceListDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        editingPriceList={null}
        formData={createForm}
        setFormData={setCreateForm}
        onSubmit={(e) => {
          e?.preventDefault();
          handleCreatePriceList();
        }}
      />
      {/* Cost Update Dialog */}
      <CostUpdateDialog
        open={isCostUpdateDialogOpen}
        onClose={() => setIsCostUpdateDialogOpen(false)}
        onSuccess={() => {
          // Refresh price lists to recalculate prices
          fetchPriceLists();
        }}
      />
      
      {/* Audit Modal */}
      <ProductAuditModal
        open={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />
    </div>
  );
}
