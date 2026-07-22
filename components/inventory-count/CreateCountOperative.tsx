'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Package, ListFilter, Search, AlertCircle, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SuggestedProduct {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  score: number;
  location: string | null;
}

interface CreateCountOperativeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCountOperative({ open, onOpenChange }: CreateCountOperativeProps) {
  const [limit, setLimit] = useState(20);
  const [suggested, setSuggested] = useState<SuggestedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory-counts/suggestions?limit=${limit}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuggested(data);
      setSelectedIds(new Set(data.map((p: SuggestedProduct) => p.id)));
    } catch (error: any) {
      toast.error('Error al cargar sugerencias: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSuggestions();
    }
  }, [open]);

  const handleToggleProduct = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleCreate = async () => {
    if (selectedIds.size === 0) {
      toast.error('Debe seleccionar al menos un producto');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/inventory-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Operativo de conteo creado exitosamente');
      window.location.href = `/adm/inventory-counts/${data.id}`;
    } catch (error: any) {
      toast.error('Error al crear operativo: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ListFilter className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Nuevo Conteo Cíclico</DialogTitle>
              <DialogDescription>
                Auditoría inteligente basada en riesgo de descuadre y rotación.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex items-end gap-4 p-4 rounded-xl bg-muted/30 border">
            <div className="grid w-full max-w-[200px] items-center gap-1.5">
              <Label htmlFor="limit" required className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Artículos a sugerir
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  type="number"
                  id="limit"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
                  className="pl-9 bg-background font-mono"
                  aria-required="true"
                />
              </div>
            </div>
            <Button onClick={fetchSuggestions} disabled={loading} variant="outline" className="shadow-sm">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Actualizar
            </Button>
            <div className="flex-1" />
            {suggested.length > 0 && (
              <Badge variant="secondary" className="h-9 px-3 text-xs font-medium border bg-background/50">
                <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-orange-500" />
                {selectedIds.size} seleccionados
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="h-[300px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium animate-pulse">Analizando riesgo de inventario...</p>
            </div>
          ) : suggested.length > 0 ? (
            <div className="border rounded-xl overflow-hidden shadow-sm">
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-center">Ubicación</TableHead>
                      <TableHead className="text-center">Score Riesgo</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suggested.map((product) => (
                      <TableRow key={product.id} className={cn(selectedIds.has(product.id) ? "bg-primary/5" : "hover:bg-muted/30")}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold tracking-tight text-sm truncate">{product.name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">SKU: {product.sku || 'N/A'} • Stock: {product.stock}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {product.location || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-bold border-orange-200 bg-orange-50 text-orange-700",
                            product.score > 50 && "border-red-200 bg-red-50 text-red-700"
                          )}>
                            {product.score}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className={cn(
                                  "h-8 w-8 rounded-full transition-all",
                                  selectedIds.has(product.id)
                                    ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                )}
                                onClick={() => handleToggleProduct(product.id)}
                                aria-label={selectedIds.has(product.id) ? "Quitar del operativo" : "Incluir en operativo"}
                              >
                                {selectedIds.has(product.id) ? <Trash2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {selectedIds.has(product.id) ? "Quitar del operativo" : "Incluir en operativo"}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/10">
              <Search className="h-8 w-8 opacity-20" />
              <p className="text-sm">No hay sugerencias disponibles para este límite.</p>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleCreate}
            disabled={creating || selectedIds.size === 0}
            className="bg-slate-900 text-white hover:bg-slate-800 shadow-xl min-w-[200px]"
          >
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Iniciar Operativo ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
