'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, X, MapPin, Package, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OperativeItem {
  id: string;
  productId: string;
  isFound: boolean;
  reportedAt: string | null;
  product: {
    name: string;
    sku: string | null;
    location: string | null;
  };
}

interface Operative {
  id: string;
  status: string;
  items: OperativeItem[];
}

const statusTranslations: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
  APPROVED: 'Aprobado',
  CANCELLED: 'Cancelado',
};

export function MobileCountView({ operativeId }: { operativeId: string }) {
  const [operative, setOperative] = useState<Operative | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Single item state (for the active count)
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [countedStock, setCountedStock] = useState<string>('');
  const [newLocation, setNewLocation] = useState<string>('');

  const fetchOperative = async () => {
    try {
      const res = await fetch(`/api/inventory-counts/${operativeId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOperative(data);

      // Auto-select first non-reported item
      const nextItem = data.items.find((i: OperativeItem) => !i.reportedAt);
      if (nextItem) {
        setActiveItemId(nextItem.id);
        setNewLocation(nextItem.product.location || '');
        setCountedStock('');
      } else {
        setActiveItemId(null);
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperative();
  }, [operativeId]);

  const handleReport = async (isFound: boolean) => {
    if (!activeItemId) return;
    if (isFound && (!countedStock || parseInt(countedStock) < 1)) {
      toast.error('Ingrese una cantidad válida');
      return;
    }

    setSubmitting(activeItemId);
    try {
      const res = await fetch('/api/inventory-counts/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: activeItemId,
          isFound,
          countedStock: isFound ? countedStock : 0,
          newLocation
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success(isFound ? 'Registrado como encontrado' : 'Registrado como no encontrado');
      fetchOperative();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!operative) return <div className="p-8 text-center">Operativo no encontrado</div>;

  if (operative.status === 'APPROVED' || operative.status === 'COMPLETED' && !activeItemId) {
    return (
      <Card className="m-4">
        <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
          <div className="bg-green-100 p-4 rounded-full">
            <Check className="h-12 w-12 text-emerald-700" />
          </div>
          <CardTitle>¡Conteo Finalizado!</CardTitle>
          <CardDescription>
            Has completado todos los artículos de esta lista. El administrador revisará los resultados.
          </CardDescription>
          <Badge variant="outline" className="text-lg py-1 px-4">Estado: {statusTranslations[operative.status] || operative.status}</Badge>
        </CardContent>
      </Card>
    );
  }

  const activeItem = operative.items.find(i => i.id === activeItemId);
  const remainingCount = operative.items.filter(i => !i.reportedAt).length;

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
      <div className="flex justify-between items-center px-2">
        <h1 className="text-xl font-bold">Auditoría de Stock</h1>
        <Badge variant="secondary">{remainingCount} pendientes</Badge>
      </div>

      {activeItem ? (
        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Package className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">Producto a Contar</span>
            </div>
            <CardTitle className="text-2xl leading-tight">{activeItem.product.name}</CardTitle>
            <CardDescription className="text-base">
              SKU: <span className="font-mono font-bold text-foreground">{activeItem.product.sku || 'S/N'}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Ubicación en Taller
              </Label>
              <Input
                id="location"
                placeholder="Ej: Estante A-12"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="text-lg h-12"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity" className="text-lg font-bold">Cantidad Física Encontrada</Label>
              <div className="relative">
                <Input
                  id="quantity"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={countedStock}
                  onChange={(e) => setCountedStock(e.target.value)}
                  className="text-3xl h-16 font-bold text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button
                variant="destructive"
                size="lg"
                className="h-16 text-lg font-bold flex flex-col gap-0"
                onClick={() => handleReport(false)}
                disabled={!!submitting}
              >
                <X className="h-6 w-6" />
                <span>No está</span>
              </Button>
              <Button
                size="lg"
                className="h-16 text-lg font-bold flex flex-col gap-0"
                onClick={() => handleReport(true)}
                disabled={!!submitting || !countedStock}
              >
                <Check className="h-6 w-6" />
                <span>Encontrado</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center p-8 text-muted-foreground">Cargando siguiente producto...</div>
      )}

      {/* Progress small list */}
      <div className="pt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2 uppercase">Avance del operativo</h3>
        <div className="flex gap-1 h-2 rounded-full bg-muted overflow-hidden">
          {operative.items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex-1 transition-all",
                item.reportedAt ? (item.isFound ? "bg-emerald-500" : "bg-red-500") : "bg-transparent"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
