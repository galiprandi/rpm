'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, AlertTriangle, Info, RefreshCcw, Package, MapPin, Calendar, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EnhancedItem {
  id: string;
  productId: string;
  theoreticalStock: number;
  countedStock: number | null;
  previousLocation: string | null;
  newLocation: string | null;
  isFound: boolean;
  concurrentMovement: number;
  salesDuringCount: number;
  currentTheoreticalStock: number;
  suggestedStock: number;
  reportedAt: string | null;
  product: {
    name: string;
    sku: string | null;
  };
}

interface Operative {
  id: string;
  status: string;
  createdAt: string;
  items: EnhancedItem[];
}

export function ApprovalView({ operativeId }: { operativeId: string }) {
  const [operative, setOperative] = useState<Operative | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [adjustments, setAdjustments] = useState<Record<string, { stock: number; location: string }>>({});

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory-counts/${operativeId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOperative(data);

      // Initialize adjustments with suggested values
      const initial: Record<string, { stock: number; location: string }> = {};
      data.items.forEach((item: EnhancedItem) => {
        initial[item.id] = {
          stock: item.suggestedStock,
          location: item.newLocation || item.previousLocation || ''
        };
      });
      setAdjustments(initial);
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [operativeId]);

  const handleUpdateAdj = (itemId: string, field: 'stock' | 'location', value: any) => {
    setAdjustments(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const payload = Object.entries(adjustments).map(([itemId, data]) => ({
        itemId,
        finalStock: data.stock,
        finalLocation: data.location
      }));

      const res = await fetch(`/api/inventory-counts/${operativeId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustments: payload }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success('Inventario ajustado correctamente');
      window.location.reload();
    } catch (error: any) {
      toast.error('Error al aprobar: ' + error.message);
    } finally {
      setApproving(false);
    }
  };

  const stats = useMemo(() => {
    if (!operative) return null;
    const reportedCount = operative.items.filter(i => i.reportedAt).length;
    const totalCount = operative.items.length;
    const progressPercent = totalCount > 0 ? Math.round((reportedCount / totalCount) * 100) : 0;
    return { reportedCount, totalCount, progressPercent };
  }, [operative]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!operative) return <div className="p-8 text-center">Operativo no encontrado</div>;

  const isApproved = operative.status === 'APPROVED';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold tracking-tight">Revisión de Auditoría</h2>
              <StatusBadge status={operative.status} />
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Iniciado el {new Date(operative.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border text-xs font-medium text-muted-foreground">
              <Package className="h-3.5 w-3.5 text-primary" />
              {stats?.totalCount} Artículos
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border text-xs font-medium text-muted-foreground">
              <ClipboardList className="h-3.5 w-3.5 text-primary" />
              {stats?.reportedCount} Reportados
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${stats?.progressPercent}%` }}
                  />
                </div>
                <span>{stats?.progressPercent}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchDetails} disabled={loading || approving}>
            <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Actualizar
          </Button>
          {!isApproved && (
            <Button
              onClick={handleApprove}
              disabled={approving || operative.status !== 'COMPLETED'}
              className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg"
            >
              {approving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Aprobar y Ajustar
            </Button>
          )}
        </div>
      </div>

      {isApproved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3 text-emerald-800">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Este operativo ya ha sido aprobado y el stock ha sido impactado en el sistema.</p>
        </div>
      )}

      <Card className="overflow-hidden border-primary/10 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[300px]">Producto</TableHead>
              <TableHead className="text-center">Stock Sistema</TableHead>
              <TableHead className="text-center">Conteo</TableHead>
              <TableHead className="w-[120px]">Alertas</TableHead>
              <TableHead className="w-[100px]">Ajuste Final</TableHead>
              <TableHead className="w-[180px]">Ubicación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operative.items.map((item) => {
              const diff = (item.countedStock || 0) - item.theoreticalStock;
              const hasAlert = item.concurrentMovement !== 0;
              const adj = adjustments[item.id] || { stock: 0, location: '' };

              return (
                <TableRow key={item.id} className={cn(!item.isFound && "bg-red-50/30", "transition-colors")}>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0" aria-hidden="true">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold tracking-tight text-sm truncate">{item.product.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">SKU: {item.product.sku || 'N/A'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <span className="text-sm font-medium text-muted-foreground">{item.theoreticalStock}</span>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {!item.isFound ? (
                      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[10px] h-5">No encontrado</Badge>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm">{item.countedStock}</span>
                        <span className={cn("text-[10px] font-medium", diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-muted-foreground")}>
                          ({diff > 0 ? '+' : ''}{diff})
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    {hasAlert ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="cursor-help bg-amber-50 text-amber-600 border-amber-200 text-[10px] h-5 font-bold">
                              <AlertTriangle className="h-3 w-3 mr-1" /> {item.concurrentMovement > 0 ? '+' : ''}{item.concurrentMovement}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            Se registraron {item.salesDuringCount} ventas durante el proceso.
                            El stock teórico actual es {item.currentTheoreticalStock}.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="space-y-1">
                      <Input
                        type="number"
                        value={adj.stock}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateAdj(item.id, 'stock', parseInt(e.target.value) || 0)}
                        disabled={isApproved}
                        className={cn("font-bold text-center h-8 text-sm focus-visible:ring-primary", adj.stock !== item.countedStock && "border-amber-500 ring-amber-500/20")}
                      />
                      {adj.stock !== item.countedStock && (
                        <div className="text-[9px] text-amber-600 font-medium flex items-center gap-0.5 justify-center">
                          <Info className="h-2 w-2" /> Sug: {item.suggestedStock}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="relative">
                      <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" aria-hidden="true" />
                      <Input
                        value={adj.location}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateAdj(item.id, 'location', e.target.value)}
                        disabled={isApproved}
                        placeholder="Sin ubicación"
                        className={cn("h-8 text-xs pl-7 focus-visible:ring-primary", adj.location !== item.previousLocation && "border-blue-500 ring-blue-500/20")}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Pendiente</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">En Proceso</Badge>;
    case 'COMPLETED':
      return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Realizado</Badge>;
    case 'APPROVED':
      return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Aprobado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
