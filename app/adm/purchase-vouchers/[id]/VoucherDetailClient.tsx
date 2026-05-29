'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/adm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUI } from '@/components/ui/UIProvider';
import { ArrowLeft, Save, Plus, Trash2, CheckCircle } from 'lucide-react';
import { type PurchaseVoucher } from '@/types/purchaseVoucher';
import Link from 'next/link';

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
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('');

  // Load products list for the simple load dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          // Map products list
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !quantity || !unitCost) {
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
          productId: selectedProductId,
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
      setSelectedProductId('');
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/adm/purchase-vouchers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la lista
          </Button>
        </Link>
      </div>

      <Header
        title={`Comprobante ${voucher.letter} - ${voucher.number}`}
        description={`Proveedor: ${voucher.supplier?.name}`}
        leftActions={
          <div key="status-badge" className="flex items-center gap-2 mr-4">
            <span className="text-sm text-muted-foreground">Estado:</span>
            {voucher.status === 'DRAFT' ? (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                Borrador
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Finalizado
              </Badge>
            )}
          </div>
        }
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Cabecera info */}
        <div className="bg-card border rounded-lg p-6 space-y-4 h-fit">
          <h3 className="font-semibold text-lg border-b pb-2">Información General</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha Emisión:</span>
              <span className="font-medium">{new Date(voucher.date).toLocaleDateString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Forma de Pago:</span>
              <span className="font-medium">{voucher.paymentMethod?.name || 'Cuenta Corriente'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto Declarado:</span>
              <span className="font-bold text-primary">
                {parseFloat(voucher.totalAmount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-muted-foreground">Total Cargado:</span>
              <span className="font-bold">
                {totalCalculated.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </span>
            </div>
          </div>

          {voucher.notes && (
            <div className="pt-2 border-t text-xs text-muted-foreground">
              <span className="font-semibold block mb-1">Notas:</span>
              <p className="whitespace-pre-wrap">{voucher.notes}</p>
            </div>
          )}

          {voucher.status === 'DRAFT' && (
            <Button
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleFinalize}
              disabled={loading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar Carga
            </Button>
          )}
        </div>

        {/* Productos cargados / Carga items */}
        <div className="md:col-span-2 space-y-6">
          {voucher.status === 'DRAFT' && (
            <form onSubmit={handleAddItem} className="bg-card border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Agregar Producto al Comprobante</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="product-select">Producto</Label>
                  <select
                    id="product-select"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    required
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qty">Cantidad</Label>
                  <Input
                    id="qty"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
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
                  />
                </div>
                <div className="flex items-end justify-end">
                  <Button type="submit" disabled={loading} className="w-full md:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Cargar Ítem
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Detalle de Artículos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Producto</th>
                    <th className="px-4 py-2 text-right">Cantidad</th>
                    <th className="px-4 py-2 text-right">Costo Unitario</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(voucher.items || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground">
                        No hay productos cargados en este comprobante
                      </td>
                    </tr>
                  ) : (
                    (voucher.items || []).map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-medium">{item.productName}</td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">
                          {parseFloat(item.unitCost).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {parseFloat(item.subtotal).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
