'use client';

import React, { useState } from 'react';
import { CreateDraftVoucherDialog } from '@/components/purchaseVoucher/CreateDraftVoucherDialog';
import { AddVoucherItemDialog } from '@/components/purchaseVoucher/AddVoucherItemDialog';
import { VoucherPreviewDialog } from '@/components/purchaseVoucher/VoucherPreviewDialog';
import { type PurchaseVoucher } from '@/types/purchaseVoucher';

interface VoucherWithPaymentMethod extends PurchaseVoucher {
  paymentMethodId: string | null;
}
import { Header, CrudStats } from '@/components/adm';
import { Button } from '@/components/ui/button';
import { Receipt, Plus, History, FileText } from 'lucide-react';

interface PurchaseVouchersClientProps {
  initialVouchers: VoucherWithPaymentMethod[];
}

export default function PurchaseVouchersClient({ initialVouchers }: PurchaseVouchersClientProps) {
  const [vouchers, setVouchers] = useState<VoucherWithPaymentMethod[]>(initialVouchers);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [currentVoucherId, setCurrentVoucherId] = useState<string>('');
  const [currentVoucherTotal, setCurrentVoucherTotal] = useState<number>(0);
  const [currentVoucherPaymentMethodId, setCurrentVoucherPaymentMethodId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const draftsCount = vouchers.filter((v) => v.status === 'DRAFT').length;
  const finalizedCount = vouchers.filter((v) => v.status === 'FINALIZED').length;
  const totalAmountSum = vouchers
    .reduce((acc, v) => acc + parseFloat(v.totalAmount || '0'), 0)
    .toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const handleVoucherCreated = async () => {
    // Reload vouchers after creation
    try {
      const response = await fetch('/api/purchase-vouchers');
      if (response.ok) {
        const data = await response.json();
        // API returns raw vouchers without computed fields; refetch via page reload
        // or compute client-side from items if available
        const vouchersFormatted = data.map((v: VoucherWithPaymentMethod & { items?: { subtotal: string }[] }) => {
          const itemsCount = v.items?.length ?? 0;
          const itemsSubtotal = v.items?.reduce((sum, it) => sum + parseFloat(it.subtotal), 0) ?? 0;
          return {
            id: v.id,
            supplierId: v.supplierId,
            supplier: v.supplier ? { name: v.supplier.name } : { name: 'Desconocido' },
            supplierName: v.supplierName,
            letter: v.letter,
            number: v.number,
            date: v.date,
            totalAmount: v.totalAmount,
            paymentMethodId: v.paymentMethodId,
            notes: v.notes,
            status: v.status as 'DRAFT' | 'FINALIZED',
            createdBy: v.createdBy,
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
            finalizedAt: v.finalizedAt,
            itemsCount,
            itemsSubtotal,
          };
        });
        setVouchers(vouchersFormatted);
      }
    } catch (error) {
      console.error('Error reloading vouchers:', error);
    }
  };

  const stats = [
    {
      label: 'Borradores',
      value: draftsCount,
      icon: FileText,
      iconColor: 'rgb(249 115 22)', // text-orange-500
    },
    {
      label: 'Finalizados',
      value: finalizedCount,
      icon: History,
      iconColor: 'rgb(34 197 94)', // text-green-500
    },
    {
      label: 'Total Acumulado',
      value: totalAmountSum,
      icon: Receipt,
      iconColor: 'rgb(59 130 246)', // text-blue-500
    }
  ];

  return (
    <div className="space-y-6">
      <Header
        title="Comprobantes de Compra"
        description="Gestión y registro de facturas de proveedores y comprobantes"
        primaryAction={{
          label: 'Nuevo Comprobante',
          onClick: () => setIsCreateDialogOpen(true),
          icon: Plus,
          ariaLabel: 'Crear nuevo comprobante de compra',
        }}
      />

      <CrudStats stats={stats} />

      <div className="bg-card rounded-lg border shadow-xs p-6">
        <h2 className="text-lg font-semibold mb-4 text-card-foreground">Listado de Comprobantes</h2>
        {vouchers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
            <p className="text-lg font-medium">No hay comprobantes cargados</p>
            <p className="text-sm">Comienza creando un borrador con el botón &apos;Nuevo Comprobante&apos;.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Proveedor</th>
                  <th className="text-left p-3 font-medium">Comprobante</th>
                  <th className="text-left p-3 font-medium">Fecha</th>
                  <th className="text-left p-3 font-medium">Estado</th>
                  <th className="text-right p-3 font-medium">Monto Total</th>
                  <th className="text-left p-3 font-medium w-40">Carga</th>
                  <th className="text-right p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => {
                  const itemsCount = v.itemsCount ?? 0;
                  const itemsSubtotal = v.itemsSubtotal ?? 0;
                  const totalAmount = parseFloat(v.totalAmount);
                  const progressPct = totalAmount > 0 ? Math.min(100, (itemsSubtotal / totalAmount) * 100) : 0;
                  const isComplete = progressPct >= 95;
                  return (
                    <tr
                      key={v.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => {
                        if (v.status === 'DRAFT') {
                          setCurrentVoucherId(v.id);
                          setCurrentVoucherTotal(totalAmount);
                          setCurrentVoucherPaymentMethodId(v.paymentMethodId ?? null);
                          setIsPreviewOpen(true);
                        }
                      }}
                    >
                      <td className="p-3">
                        {v.supplier?.name || v.supplierName || 'Desconocido'}
                      </td>
                      <td className="p-3 font-medium">
                        {v.letter} - {v.number}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(v.date).toLocaleDateString('es-AR')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            v.status === 'DRAFT'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {v.status === 'DRAFT' ? 'Borrador' : 'Finalizado'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium">
                        ${totalAmount.toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-3">
                        {v.status === 'DRAFT' && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {itemsCount} {itemsCount === 1 ? 'ítem' : 'ítems'}
                              </span>
                              <span className={`font-medium ${isComplete ? 'text-green-600' : 'text-orange-500'}`}>
                                {progressPct.toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full max-w-32 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isComplete ? 'bg-green-500' : 'bg-orange-400'
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              ${itemsSubtotal.toFixed(2)} / ${totalAmount.toFixed(2)}
                            </div>
                          </div>
                        )}
                        {v.status === 'FINALIZED' && (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {v.status === 'DRAFT' ? (
                          <Button
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setCurrentVoucherId(v.id);
                              setCurrentVoucherTotal(totalAmount);
                              setCurrentVoucherPaymentMethodId(v.paymentMethodId ?? null);
                              setIsPreviewOpen(true);
                            }}
                          >
                            Continuar
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateDraftVoucherDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onDraftCreated={(voucher) => {
          setIsCreateDialogOpen(false);
          setCurrentVoucherId(voucher.id);
          setCurrentVoucherTotal(parseFloat(voucher.totalAmount?.toString() || '0'));
          setCurrentVoucherPaymentMethodId((voucher as unknown as { paymentMethodId?: string | null }).paymentMethodId ?? null);
          setIsAddItemDialogOpen(true);
        }}
      />

      <VoucherPreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        voucherId={currentVoucherId}
        onContinue={() => {
          setIsPreviewOpen(false);
          setIsAddItemDialogOpen(true);
        }}
      />

      <AddVoucherItemDialog
        isOpen={isAddItemDialogOpen}
        onClose={() => {
          setIsAddItemDialogOpen(false);
          handleVoucherCreated();
        }}
        voucherId={currentVoucherId}
        voucherTotal={currentVoucherTotal}
        paymentMethodId={currentVoucherPaymentMethodId}
        onItemAdded={() => {
          handleVoucherCreated();
        }}
        onFinish={() => {
          setIsAddItemDialogOpen(false);
          handleVoucherCreated();
        }}
      />
    </div>
  );
}
