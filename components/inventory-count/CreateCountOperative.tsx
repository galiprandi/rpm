'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Conteo Cíclico</DialogTitle>
          <DialogDescription>
            Define la cantidad de artículos a auditar. El sistema priorizará los de mayor riesgo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="limit">Cantidad de artículos (X)</Label>
              <Input
                type="number"
                id="limit"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
              />
            </div>
            <Button onClick={fetchSuggestions} disabled={loading} variant="outline">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Actualizar Sugerencias'}
            </Button>
          </div>

          {suggested.length > 0 && (
            <div className="border rounded-md">
              <div className="bg-muted p-3 flex justify-between items-center border-b font-medium">
                <span>Productos Sugeridos ({selectedIds.size} seleccionados)</span>
                <Badge variant="secondary">Basado en algoritmos de riesgo</Badge>
              </div>
              <ul className="divide-y max-h-[400px] overflow-auto">
                {suggested.map((product) => (
                  <li key={product.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        SKU: {product.sku || 'N/A'} • Stock actual: {product.stock} • Ubicación: {product.location || 'Sin asignar'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right mr-4">
                        <span className="text-xs font-semibold text-orange-600">Riesgo: {product.score}</span>
                      </div>
                      <Button
                        size="sm"
                        variant={selectedIds.has(product.id) ? "destructive" : "outline"}
                        onClick={() => handleToggleProduct(product.id)}
                      >
                        {selectedIds.has(product.id) ? <Trash2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={handleCreate} disabled={creating || selectedIds.size === 0} size="lg">
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar e Iniciar Conteo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
