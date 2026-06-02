'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, AlertTriangle, Info, RefreshCcw } from 'lucide-react';
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

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!operative) return <div className="p-8 text-center">Operativo no encontrado</div>;

  const isApproved = operative.status === 'APPROVED';
  const reportedCount = operative.items.filter(i => i.reportedAt).length;
  const totalCount = operative.items.length;
  const progressPercent = totalCount > 0 ? Math.round((reportedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Revisión de Auditoría</h1>
          <p className="text-muted-foreground">Iniciado el {new Date(operative.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{reportedCount}/{totalCount} items</span>
              <span className="text-sm text-muted-foreground">({progressPercent}%)</span>
            </div>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchDetails} disabled={loading || approving}>
              <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Actualizar
            </Button>
            {!isApproved && (
              <Button onClick={handleApprove} disabled={approving || operative.status !== 'COMPLETED'} size="lg">
                {approving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Aprobar y Ajustar Stock
              </Button>
            )}
          </div>
        </div>
      </div>

      {isApproved && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 flex items-center gap-3 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Este operativo ya ha sido aprobado y el stock ha sido impactado.</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Producto</TableHead>
              <TableHead className="text-center w-[100px]">Stock</TableHead>
              <TableHead className="w-[120px]">Alertas</TableHead>
              <TableHead className="w-[100px]">Ajuste</TableHead>
              <TableHead className="w-[140px]">Ubicación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operative.items.map((item) => {
              const diff = (item.countedStock || 0) - item.theoreticalStock;
              const hasAlert = item.concurrentMovement !== 0;
              const adj = adjustments[item.id] || { stock: 0, location: '' };

              return (
                <TableRow key={item.id} className={cn(!item.isFound && "bg-red-50/30")}>
                  <TableCell className="py-2">
                    <div className="font-medium text-sm truncate">{item.product.name}</div>
                    <div className="text-[10px] text-muted-foreground">SKU: {item.product.sku || 'N/A'}</div>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <div className="text-xs space-y-0.5">
                      <div className="text-muted-foreground">Ini: {item.theoreticalStock}</div>
                      {!item.isFound ? (
                        <Badge variant="destructive" className="text-[10px] h-5">No encontrado</Badge>
                      ) : (
                        <div>
                          <span className="font-bold text-sm">{item.countedStock}</span>
                          <span className={cn("text-[10px] ml-1", diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-muted-foreground")}>
                            ({diff > 0 ? '+' : ''}{diff})
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    {hasAlert && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="cursor-help bg-orange-100 text-orange-700 border-orange-200 text-[10px] h-5">
                              <AlertTriangle className="h-3 w-3 mr-1" /> {item.concurrentMovement > 0 ? '+' : ''}{item.concurrentMovement}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            Se registraron {item.salesDuringCount} ventas durante el proceso.
                            El stock teórico actual es {item.currentTheoreticalStock}.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {!hasAlert && <span className="text-[10px] text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="number"
                      value={adj.stock}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateAdj(item.id, 'stock', parseInt(e.target.value) || 0)}
                      disabled={isApproved}
                      className={cn("font-bold text-center h-8 text-sm", adj.stock !== item.countedStock && "border-orange-500")}
                    />
                    {adj.stock !== item.countedStock && (
                      <div className="text-[9px] text-orange-600 mt-0.5 flex items-center gap-0.5">
                        <Info className="h-2 w-2" /> Sug: {item.suggestedStock}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      value={adj.location}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateAdj(item.id, 'location', e.target.value)}
                      disabled={isApproved}
                      placeholder="Sin ubicación"
                      className={cn("h-8 text-xs", adj.location !== item.previousLocation && "border-blue-500")}
                    />
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
