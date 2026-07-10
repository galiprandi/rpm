'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, ArrowRight, MessageSquare, Car, Truck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatARS, relativeTime } from '@/lib/utils/format';
import { getWhatsAppLink, getWorkOrderMessage } from '@/lib/utils/whatsapp';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReadyForDeliveryCardProps {
  readyForDelivery: Array<{
    workOrderId: string;
    vehicle: {
      type: 'COMPACT' | 'SEDAN' | 'SUV' | 'PICKUP' | 'TRUCK';
      description: string;
      identifier: string;
    };
    customer: {
      name: string;
      phone: string;
    };
    total: number;
    totalPaid: number;
    completedAt: string;
    invoiceStatus: 'ISSUED' | 'PENDING';
  }>;
}

export function ReadyForDeliveryCard({
  readyForDelivery,
}: ReadyForDeliveryCardProps) {
  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'PICKUP':
      case 'TRUCK':
        return <Truck className="h-4 w-4 text-primary" aria-hidden="true" />;
      default:
        return <Car className="h-4 w-4 text-primary" aria-hidden="true" />;
    }
  };

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
              className="flex items-start justify-between p-2 rounded-lg bg-slate-50/50 border border-transparent hover:border-slate-200 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {getVehicleIcon(item.vehicle.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tracking-tight text-sm truncate font-mono">
                      {item.vehicle.identifier}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {item.vehicle.description}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium">{item.customer.name}</span>
                    <span className="text-muted-foreground/40">•</span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      <span>{relativeTime(item.completedAt)}</span>
                    </div>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {formatARS(item.total)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-emerald-700 hover:text-emerald-700 hover:bg-emerald-50"
                      onClick={() => {
                        const msg = getWorkOrderMessage({
                          customerName: item.customer.name,
                          vehicleIdentifier: item.vehicle.identifier,
                          status: 'READY',
                          total: item.total,
                          totalPaid: item.totalPaid,
                        });
                        window.open(getWhatsAppLink(item.customer.phone, msg), '_blank');
                      }}
                      aria-label={`Notificar por WhatsApp a ${item.customer.name}`}
                    >
                      <MessageSquare className="h-4 w-4 pointer-events-none" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Notificar por WhatsApp</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-blue-700 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <a href={`tel:${item.customer.phone}`} aria-label={`Llamar a ${item.customer.name}`}>
                        <Phone className="h-4 w-4 pointer-events-none" aria-hidden="true" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Llamar al cliente</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
        {readyForDelivery.length >= 5 && (
          <Link href="/adm/work-orders?status=READY">
            <Button variant="link" className="p-0 h-auto text-xs mt-3 w-full">
              Ver todos
              <ArrowRight className="h-3 w-3 ml-1 pointer-events-none" aria-hidden="true" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
