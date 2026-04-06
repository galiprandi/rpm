'use client';

import { ModalBase } from '@/components/ui/ModalBase';
import { Badge } from '@/components/ui/badge';

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
  IN: { label: 'Entrada', color: 'bg-green-100 text-green-800' },
  OUT: { label: 'Salida', color: 'bg-red-100 text-red-800' },
  ADJUSTMENT: { label: 'Ajuste', color: 'bg-yellow-100 text-yellow-800' },
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
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Cargando movimientos...</div>
        </div>
      ) : movements.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">No hay movimientos registrados</div>
        </div>
      ) : (
        <div className="overflow-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="text-left p-2 font-medium">Fecha/Hora</th>
                <th className="text-left p-2 font-medium">Usuario</th>
                <th className="text-left p-2 font-medium">Tipo</th>
                <th className="text-right p-2 font-medium">Cantidad</th>
                <th className="text-center p-2 font-medium">Stock</th>
                <th className="text-left p-2 font-medium">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {movements.map((movement) => (
                <tr key={movement.id} className="hover:bg-muted/50">
                  <td className="p-2 whitespace-nowrap">
                    {formatDate(movement.createdAt)}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {movement.userName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span className="truncate max-w-[120px]">
                        {movement.userName || 'Sistema'}
                      </span>
                    </div>
                  </td>
                  <td className="p-2">
                    <Badge className={TYPE_CONFIG[movement.type]?.color || 'bg-gray-100'}>
                      {TYPE_CONFIG[movement.type]?.label || movement.type}
                    </Badge>
                  </td>
                  <td className="p-2 text-right font-mono">
                    <span className={movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </span>
                  </td>
                  <td className="p-2 text-center font-mono text-muted-foreground">
                    {movement.previousStock}→{movement.newStock}
                  </td>
                  <td className="p-2">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ModalBase>
  );
}
