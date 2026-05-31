'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/adm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUI } from '@/components/ui/UIProvider';
import { Save, Plus, Trash2, CheckCircle, Calendar, CreditCard, DollarSign, Package, AlertCircle, History, Loader2 } from 'lucide-react';
import { type PurchaseVoucher } from '@/types/purchaseVoucher';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface VoucherDetailClientProps {
  initialVoucher: PurchaseVoucher & {
    supplier: { name: string };
    paymentMethod: { name: string } | null;
  };
}

export default function VoucherDetailClient({ initialVoucher }: VoucherDetailClientProps) {
  const router = useRouter();
  const { alert, confirm } = useUI();
  const [voucher, setVoucher] = useState(initialVoucher);
  const [loading, setLoading] = useState(false);

  // Item Carga Form
  const [selectedProduct, setSelectedProduct] = useState<{id: string, name: string, price: number} | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('');

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity || !unitCost) {
      await alert({
        title: 'Error',
        description: 'Complete todos los campos del producto.',
        variant: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/purchase-vouchers/${voucher.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: parseInt(quantity),
          unitCost: parseFloat(unitCost),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'No se pudo agregar el ítem');
      }

      // Reload Voucher details
      const detailRes = await fetch(`/api/purchase-vouchers/${voucher.id}`);
      if (detailRes.ok) {
        const updatedVoucher = await detailRes.json();
        setVoucher(updatedVoucher);
      }

      // Reset item inputs
      setSelectedProduct(null);
      setQuantity('1');
      setUnitCost('');
    } catch (err: any) {
      await alert({
        title: 'Error',
        description: err.message || 'Error al agregar producto.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const confirmed = await confirm({
      title: 'Eliminar ítem',
      description: '¿Estás seguro de eliminar este producto del comprobante?',
      variant: 'destructive',
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/purchase-vouchers/${voucher.id}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Error al eliminar ítem');
      }

      // Reload Voucher details
      const detailRes = await fetch(`/api/purchase-vouchers/${voucher.id}`);
      if (detailRes.ok) {
        const updatedVoucher = await detailRes.json();
        setVoucher(updatedVoucher);
      }
    } catch (err: any) {
      await alert({
        title: 'Error',
        description: err.message || 'Error al eliminar ítem.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    const itemsTotal = (voucher.items || []).reduce((acc, item) => {
      return acc + (parseFloat(item.unitCost) * item.quantity);
    }, 0);
    const declaredTotal = parseFloat(voucher.totalAmount);

    if (Math.abs(itemsTotal - declaredTotal) > 0.01) {
      const proceed = await confirm({
        title: 'Diferencia detectada',
        description: `El total de los productos (${itemsTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}) no coincide con el total declarado del comprobante (${declaredTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}). ¿Desea finalizar el comprobante de todos modos?`,
        confirmText: 'Finalizar',
        cancelText: 'Cancelar',
        variant: 'destructive',
      });
      if (!proceed) return;
    } else {
      const proceed = await confirm({
        title: 'Finalizar comprobante',
        description: '¿Está seguro de finalizar este comprobante de compra? Esta acción aumentará el stock de los productos y no podrá ser revertida.',
        confirmText: 'Finalizar',
        cancelText: 'Cancelar',
      });
      if (!proceed) return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/purchase-vouchers/${voucher.id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: voucher.paymentMethodId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al finalizar el comprobante');
      }

      const updated = await res.json();
      setVoucher(updated);
      router.refresh();
      await alert({
        title: 'Comprobante Finalizado',
        description: 'El stock de los productos ha sido incrementado correctamente.',
        variant: 'success',
      });
    } catch (err: any) {
      await alert({
        title: 'Error',
        description: err.message || 'Error al finalizar el comprobante',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCalculated = (voucher.items || []).reduce(
    (sum, item) => sum + parseFloat(item.unitCost) * item.quantity,
    0
  );

  const isComplete = Math.abs(totalCalculated - parseFloat(voucher.totalAmount)) < 0.01;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Header
        title={`Comprobante ${voucher.letter} - ${voucher.number}`}
        description={`Proveedor: ${voucher.supplier?.name}`}
        showBackButton
        onBack={() => router.push('/adm/purchase-vouchers')}
        primaryAction={voucher.status === 'DRAFT' ? {
          label: 'Finalizar Carga',
          onClick: handleFinalize,
          icon: CheckCircle,
          loading: loading,
          className: 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold',
          disabled: (voucher.items || []).length === 0,
          ariaLabel: 'Finalizar la carga del comprobante y actualizar stock'
        } : undefined}
      >
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Badge
            variant="outline"
            className={
              voucher.status === 'DRAFT'
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }
          >
            {voucher.status === 'DRAFT' ? 'Borrador' : 'Finalizado'}
          </Badge>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-medium text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(voucher.date).toLocaleDateString('es-AR')}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-medium text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" />
            {voucher.paymentMethod?.name || 'Cuenta Corriente'}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/5 border border-primary/10 text-xs font-bold text-primary">
            <DollarSign className="h-3.5 w-3.5" />
            {parseFloat(voucher.totalAmount).toLocaleString('es-AR', {
              style: 'currency',
              currency: 'ARS',
            })}
          </div>
        </div>
      </Header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Productos cargados / Carga items */}
        <div className="lg:col-span-2 space-y-6">
          {voucher.status === 'DRAFT' && (
            <form onSubmit={handleAddItem} className="bg-card border rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 bg-muted/50 border-b flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Agregar Producto al Comprobante</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="product-select">Producto</Label>
                    <SearchableSelect
                      placeholder="Seleccionar producto..."
                      apiUrl="/api/products"
                      onSelect={(item) => {
                        setSelectedProduct(item);
                        setUnitCost(item.price.toString());
                      }}
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="qty">Cantidad</Label>
                      <Input
                        id="qty"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cost">Costo Unitario ($)</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={unitCost}
                        onChange={(e) => setUnitCost(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={loading || !selectedProduct} className="min-w-[140px]">
                    {loading ? (
                       <span className="flex items-center gap-2">Cargando...</span>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Cargar Ítem
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="bg-card border rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 bg-muted/50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-card-foreground">Detalle de Artículos</h3>
              </div>
              <Badge variant="secondary" className="font-mono">
                {(voucher.items || []).length} ítems
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="px-6">Producto</TableHead>
                  <TableHead className="px-6 text-right">Cantidad</TableHead>
                  <TableHead className="px-6 text-right">Costo Unitario</TableHead>
                  <TableHead className="px-6 text-right">Subtotal</TableHead>
                  <TableHead className="px-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(voucher.items || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      No hay productos cargados en este comprobante
                    </TableCell>
                  </TableRow>
                ) : (
                  (voucher.items || []).map((item) => (
                    <TableRow key={item.id} className="group">
                      <TableCell className="px-6 py-4 font-medium">{item.productName}</TableCell>
                      <TableCell className="px-6 py-4 text-right">{item.quantity}</TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        {parseFloat(item.unitCost).toLocaleString('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                        })}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-semibold">
                        {parseFloat(item.subtotal).toLocaleString('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                        })}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        {voucher.status === 'DRAFT' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={loading}
                                aria-label="Eliminar ítem del comprobante"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar ítem</TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {(voucher.items || []).length > 0 && (
                <TableBody className="bg-muted/20 border-t">
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="px-6 py-4 text-right font-medium text-muted-foreground">
                      Total Calculado:
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right font-bold text-lg">
                      {totalCalculated.toLocaleString('es-AR', {
                        style: 'currency',
                        currency: 'ARS',
                      })}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <div className="bg-card border rounded-xl shadow-xs p-6 space-y-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Resumen Financiero
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Monto Declarado</span>
                <div className="text-2xl font-bold text-primary mt-1">
                  {parseFloat(voucher.totalAmount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${isComplete ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
                <span className={`text-xs uppercase tracking-wider font-semibold ${isComplete ? 'text-emerald-700' : 'text-orange-700'}`}>Monto Cargado</span>
                <div className={`text-2xl font-bold mt-1 ${isComplete ? 'text-emerald-700' : 'text-orange-700'}`}>
                  {totalCalculated.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </div>
                {!isComplete && (
                   <div className="flex items-center gap-1.5 mt-2 text-xs text-orange-600 font-medium">
                     <AlertCircle className="h-3.5 w-3.5" />
                     Diferencia: {(parseFloat(voucher.totalAmount) - totalCalculated).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                   </div>
                )}
              </div>
            </div>

            {voucher.notes && (
              <div className="pt-4 border-t">
                <span className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Notas</span>
                <p className="text-sm text-card-foreground whitespace-pre-wrap leading-relaxed">{voucher.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
