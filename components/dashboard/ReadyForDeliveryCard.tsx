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
          <Phone
            className="h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
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
        <Phone
          className="h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {readyForDelivery.map((item) => (
            <div
              key={item.workOrderId}
              className="flex items-start justify-between p-2 rounded-lg bg-slate-50/50 border border-transparent hover:border-slate-200 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-sm" aria-hidden="true">
                    {getVehicleEmoji(item.vehicle.type)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {item.vehicle.description}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold tracking-tight">{item.customer.name}</span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="font-mono bg-muted/50 px-1 rounded">
                      #{item.workOrderId.slice(-4)}
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="font-mono font-medium text-emerald-700">
                      {formatARS(item.total)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <a href={`tel:${item.customer.phone}`} aria-label={`Llamar a ${item.customer.name}`}>
                  <Phone className="h-4 w-4 pointer-events-none" aria-hidden="true" />
                </a>
              </Button>
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
