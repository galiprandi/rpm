import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatARS, getVehicleEmoji } from '@/lib/utils/format';

interface ReadyForDeliveryCardProps {
  readyForDelivery: Array<{
    workOrderId: string;
    vehicle: {
      type: 'COMPACT' | 'SEDAN' | 'SUV' | 'PICKUP' | 'TRUCK';
      description: string;
    };
    customer: {
      name: string;
      phone: string;
    };
    total: number;
    completedAt: string;
    invoiceStatus: 'ISSUED' | 'PENDING';
  }>;
}

export function ReadyForDeliveryCard({
  readyForDelivery,
}: ReadyForDeliveryCardProps) {
  if (readyForDelivery.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Listos para Entrega
          </CardTitle>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No hay trabajos pendientes de entrega 🎉
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Listos para Entrega
        </CardTitle>
        <Phone className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {readyForDelivery.map((item) => (
            <div key={item.workOrderId} className="flex items-start justify-between p-2 rounded-lg bg-slate-50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getVehicleEmoji(item.vehicle.type)}</span>
                  <span className="font-medium text-sm">{item.vehicle.description}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {item.customer.name} · #{item.workOrderId.slice(-4)} · {formatARS(item.total)}
                </div>
              </div>
              <a
                href={`tel:${item.customer.phone}`}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <Phone className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
        {readyForDelivery.length >= 5 && (
          <Link href="/adm/work-orders?status=READY">
            <Button variant="link" className="p-0 h-auto text-xs mt-3 w-full">
              Ver todos
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
