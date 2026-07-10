"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageSquare, Car, Truck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatARS, relativeTime } from "@/lib/utils/format";
import { getWhatsAppLink, getWorkOrderMessage } from "@/lib/utils/whatsapp";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReadyForDeliveryCardProps {
  readyForDelivery: Array<{
    workOrderId: string;
    vehicle: {
      type: "COMPACT" | "SEDAN" | "SUV" | "PICKUP" | "TRUCK";
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
    invoiceStatus: "ISSUED" | "PENDING";
  }>;
}

export function ReadyForDeliveryCard({
  readyForDelivery,
}: ReadyForDeliveryCardProps) {
  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "PICKUP":
      case "TRUCK":
        return (
          <Truck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        );
      default:
        return <Car className="h-3.5 w-3.5 text-primary" aria-hidden="true" />;
    }
  };

  if (readyForDelivery.length === 0) {
    return (
      <Card className="relative overflow-hidden border-l-2 border-l-violet-500/40">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Listos para Entrega
            </span>
            <Phone
              className="h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none"
              aria-hidden="true"
            />
          </div>
          <p className="text-xs text-muted-foreground/60 py-3 text-center">
            No hay trabajos pendientes de entrega 🎉
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-l-2 border-l-violet-500/40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Listos para Entrega
          </span>
          <Phone
            className="h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-2">
          {readyForDelivery.map((item) => (
            <div
              key={item.workOrderId}
              className="flex items-start justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors group"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  {getVehicleIcon(item.vehicle.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold tracking-tight font-mono tabular-nums truncate">
                      {item.vehicle.identifier}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 truncate hidden sm:inline">
                      {item.vehicle.description}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium">{item.customer.name}</span>
                    <span className="text-muted-foreground/30">·</span>
                    <div className="flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                      <span>{relativeTime(item.completedAt)}</span>
                    </div>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="font-mono font-semibold text-emerald-600 tabular-nums">
                      {formatARS(item.total)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-500/10"
                      onClick={() => {
                        const msg = getWorkOrderMessage({
                          customerName: item.customer.name,
                          vehicleIdentifier: item.vehicle.identifier,
                          status: "READY",
                          total: item.total,
                          totalPaid: item.totalPaid,
                        });
                        window.open(
                          getWhatsAppLink(item.customer.phone, msg),
                          "_blank",
                        );
                      }}
                      aria-label={`Notificar por WhatsApp a ${item.customer.name}`}
                    >
                      <MessageSquare
                        className="h-3.5 w-3.5 pointer-events-none"
                        aria-hidden="true"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>WhatsApp</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-blue-600 hover:text-blue-600 hover:bg-blue-500/10"
                    >
                      <a
                        href={`tel:${item.customer.phone}`}
                        aria-label={`Llamar a ${item.customer.name}`}
                      >
                        <Phone
                          className="h-3.5 w-3.5 pointer-events-none"
                          aria-hidden="true"
                        />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Llamar</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
        {readyForDelivery.length >= 5 && (
          <Link
            href="/adm/work-orders?status=READY"
            className="text-[10px] text-primary hover:underline font-medium mt-2 inline-block"
          >
            Ver todos →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
