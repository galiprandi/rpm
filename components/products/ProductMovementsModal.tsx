'use client';

import { ModalBase } from '@/components/ui/ModalBase';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, PackageSearch, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reasonDetails: string | null;
  userName: string | null;
  createdAt: string;
}

interface ProductMovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    stock: number;
  } | null;
  movements: StockMovement[];
  loading: boolean;
}

const REASON_LABELS: Record<string, string> = {
  VENTA: 'Venta',
  RECEPCION: 'Recepción proveedor',
  AJUSTE_INVENTARIO: 'Ajuste inventario',
  MERMA: 'Merma / Daño',
  DEVOLUCION: 'Devolución cliente',
  CARGA_INICIAL: 'Carga inicial',
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  IN: { label: 'Entrada', color: 'text-emerald-600 border-emerald-200 bg-emerald-50' },
  OUT: { label: 'Salida', color: 'text-red-600 border-red-200 bg-red-50' },
  ADJUSTMENT: { label: 'Ajuste', color: 'text-amber-600 border-amber-200 bg-amber-50' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProductMovementsModal({
  isOpen,
  onClose,
  product,
  movements,
  loading,
}: ProductMovementsModalProps) {
  const title = product ? (
    <div className="flex items-center gap-2">
      Historial: {product.name}
      <Badge variant="secondary">Stock actual: {product.stock}</Badge>
    </div>
  ) : (
    'Historial de movimientos'
  );

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Revisa el historial completo de movimientos de stock para este producto."
      maxWidth="3xl"
      maxHeight="max-h-[80vh]"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-muted-foreground animate-pulse">Cargando movimientos...</div>
        </div>
      ) : movements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <PackageSearch className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">No hay movimientos registrados</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Este producto aún no registra entradas ni salidas.</p>
        </div>
      ) : (
        <div className="overflow-auto -mx-6 px-6">
          <Table aria-label="Historial de movimientos de stock">
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="font-medium">Fecha/Hora</TableHead>
                <TableHead className="font-medium">Usuario</TableHead>
                <TableHead className="font-medium">Tipo</TableHead>
                <TableHead className="text-right font-medium">Cantidad</TableHead>
                <TableHead className="text-center font-medium">Stock</TableHead>
                <TableHead className="font-medium">Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(movement.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                        <User className="h-4 w-4 text-primary" aria-hidden="true" />
                      </div>
                      <div className="font-semibold tracking-tight truncate max-w-[150px]">
                        {movement.userName || 'Sistema'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("font-medium", TYPE_CONFIG[movement.type]?.color)}
                    >
                      {TYPE_CONFIG[movement.type]?.label || movement.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={movement.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-muted-foreground">
                    {movement.previousStock}→{movement.newStock}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {REASON_LABELS[movement.reason] || movement.reason}
                      </div>
                      {movement.reasonDetails && (
                        <div className="text-xs text-muted-foreground">
                          {movement.reasonDetails}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </ModalBase>
  );
}
