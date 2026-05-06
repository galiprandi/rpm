'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';

interface CostUpdateBatch {
  id: string;
  createdAt: string;
  filtersApplied: Record<string, unknown>;
  adjustmentType: string;
  adjustmentValue: number;
  itemsAffected: number;
  totalProducts?: number;
  status?: string;
}

interface ProductAuditModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProductAuditModal({ open, onClose }: ProductAuditModalProps) {
  const [auditData, setAuditData] = useState<CostUpdateBatch[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const loadAuditData = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/cost-updates/history?page=${pagination.page}&pageSize=${pagination.pageSize}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al cargar historial de auditoría');
      }

      const data = await response.json();
      
      setAuditData(data.batches || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      }));
    } catch (error) {
      console.error('Error loading audit data:', error);
    }
  }, [pagination.page, pagination.pageSize]);

  // Load audit data when modal opens
  useEffect(() => {
    if (open) {
      loadAuditData();
    }
  }, [open, loadAuditData]);

  const columns: ColumnDef<CostUpdateBatch>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{date.toLocaleDateString('es-ES')}</span>
            <span className="text-xs text-muted-foreground">
              {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'adjustmentType',
      header: 'Ajuste',
      cell: ({ row }) => {
        const adjustmentType = row.getValue('adjustmentType') as string;
        const adjustmentValue = row.original.adjustmentValue;
        
        if (!adjustmentType) {
          return (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Sin ajuste</span>
            </div>
          );
        }
        
        const isIncrease = adjustmentType.includes('INC') || adjustmentType.includes('SUM');
        
        return (
          <div className="flex items-center gap-2">
            {isIncrease ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className="font-medium">
              {adjustmentType === 'PERCENTAGE_INC' || adjustmentType === 'PERCENTAGE_DEC' 
                ? `${adjustmentValue > 0 ? '+' : ''}${adjustmentValue}%`
                : `$${adjustmentValue > 0 ? '+' : ''}${adjustmentValue}`
              }
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'itemsAffected',
      header: 'Productos Afectados',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>{row.getValue('itemsAffected')}</span>
          {row.original.totalProducts && (
            <span className="text-xs text-muted-foreground">
              de {row.original.totalProducts}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'filtersApplied',
      header: 'Filtros Aplicados',
      cell: ({ row }) => {
        const filters = row.getValue('filtersApplied') as Record<string, unknown> || {};
        const filterCount = Object.keys(filters).filter(key => filters[key]).length;
        
        return (
          <div className="space-y-1">
            <Badge variant="outline" className="text-xs">
              {filterCount} filtro{filterCount !== 1 ? 's' : ''}
            </Badge>
            {filters.search && typeof filters.search === 'string' ? (
              <div className="text-xs text-muted-foreground">
                Búsqueda: &quot;{filters.search}&quot;
              </div>
            ) : null}
            {filters.categoryId && typeof filters.categoryId === 'string' ? (
              <div className="text-xs text-muted-foreground">
                Categoría: {filters.categoryId}
              </div>
            ) : null}
            {filters.supplierId && typeof filters.supplierId === 'string' ? (
              <div className="text-xs text-muted-foreground">
                Proveedor: {filters.supplierId}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const statusColors = {
          COMPLETED: 'bg-green-100 text-green-800',
          PENDING: 'bg-yellow-100 text-yellow-800',
          FAILED: 'bg-red-100 text-red-800',
        };
        
        const status = row.original.status || 'COMPLETED';
        
        return (
          <Badge 
            variant="secondary" 
            className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
          >
            {status}
          </Badge>
        );
      },
    },
  ];

  // Calculate summary stats
  const totalBatches = auditData.length;
  const totalProductsAffected = auditData.reduce((sum, batch) => sum + (batch.itemsAffected || 0), 0);
  const completedBatches = auditData.filter(batch => (batch.status || 'COMPLETED') === 'COMPLETED').length;
  const lastUpdate = auditData.length > 0 ? new Date(auditData[0].createdAt).toLocaleDateString('es-ES') : 'N/A';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial de Auditoría - Actualizaciones Masivas de Costos
          </DialogTitle>
          <DialogDescription>
            Revisa el historial completo de actualizaciones masivas de costos aplicadas a los productos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Actualizaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBatches}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Productos Afectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProductsAffected}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedBatches}</div>
                <div className="text-xs text-muted-foreground">
                  {totalBatches > 0 ? Math.round((completedBatches / totalBatches) * 100) : 0}%
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Última Actualización
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{lastUpdate}</div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <DataTable
            data={auditData}
            columns={columns}
            title="Historial de Actualizaciones"
            emptyMessage="No se encontraron actualizaciones masivas de costos"
            pageSize={pagination.pageSize}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
