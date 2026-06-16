'use client';

import { useState, useEffect } from 'react';
import { ModalBase } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, ArrowRight, Receipt, AlertTriangle } from 'lucide-react';

interface VoucherItem {
  id: string;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

interface VoucherDetail {
  id: string;
  supplier?: { name: string };
  letter: string;
  number: string;
  date: string;
  totalAmount: number;
  status: string;
  notes?: string | null;
  items?: VoucherItem[];
}

interface VoucherPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  voucherId: string;
  onContinue?: () => void;
}

export function VoucherPreviewDialog({ isOpen, onClose, voucherId, onContinue }: VoucherPreviewDialogProps) {
  const [voucher, setVoucher] = useState<VoucherDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !voucherId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/purchase-vouchers/${voucherId}`);
        if (res.ok) {
          const data = await res.json();
          setVoucher(data);
        }
      } catch (err) {
        console.error('Error loading voucher:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, voucherId]);

  const items = voucher?.items ?? [];
  const itemsSubtotal = items.reduce((sum, it) => sum + Number(it.subtotal), 0);
  const totalAmount = Number(voucher?.totalAmount ?? 0);
  const variance = Math.abs(itemsSubtotal - totalAmount);
  const tolerance = totalAmount > 0 ? totalAmount * 0.05 : 0.01;
  const isDiscrepant = variance > tolerance;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Resumen del Comprobante"
      maxWidth="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {voucher?.status === 'DRAFT' && (
            <Button onClick={onContinue}>
              Continuar carga
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      }
    >
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Cargando...</div>
      ) : !voucher ? (
        <div className="py-12 text-center text-muted-foreground">No se pudo cargar el comprobante</div>
      ) : (
        <div className="space-y-6">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Proveedor</span>
              <p className="font-medium">{voucher.supplier?.name || 'Desconocido'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Comprobante</span>
              <p className="font-medium">{voucher.letter} - {voucher.number}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Fecha</span>
              <p className="font-medium">{new Date(voucher.date).toLocaleDateString('es-AR')}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Monto Declarado</span>
              <p className="font-medium">${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Variance warning */}
          {isDiscrepant && (
            <div className="flex items-start gap-2 p-3 rounded-md text-amber-600 border border-amber-200 bg-amber-50 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">Diferencia detectada:</span>{' '}
                El total cargado (${itemsSubtotal.toFixed(2)}) difiere del monto declarado (${totalAmount.toFixed(2)}).
              </div>
            </div>
          )}

          {/* Items table */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              {items.length > 0 ? `${items.length} ${items.length === 1 ? 'ítem cargado' : 'ítems cargados'}` : 'Sin ítems'}
            </h4>

            {items.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">Costo Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          ${Number(item.unitCost).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(item.subtotal).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="bg-muted/30">
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        <Receipt className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        Total cargado:
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${itemsSubtotal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground border rounded-md">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay productos cargados aún</p>
                <p className="text-xs">Hacé click en &quot;Continuar carga&quot; para empezar</p>
              </div>
            )}
          </div>
        </div>
      )}
    </ModalBase>
  );
}
