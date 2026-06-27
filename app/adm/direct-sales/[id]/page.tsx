"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, User, Calendar, CreditCard, Package, Clock, DollarSign } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/adm/Header";

interface DirectSaleItem {
  id: string;
  productId?: string;
  serviceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: { id: string; name: string; sku?: string };
  service?: { id: string; name: string };
}

interface DirectSalePayment {
  id: string;
  amount: number;
  notes?: string;
  paymentMethod: { id: string; name: string; code: string };
}

interface DirectSale {
  id: string;
  customerName: string;
  total: number;
  notes?: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    balance: number;
  };
  items: DirectSaleItem[];
  payments: DirectSalePayment[];
}

export default function DirectSaleDetailPage() {
  const params = useParams();
  const saleId = params.id as string;

  const [sale, setSale] = useState<DirectSale | null>(null);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  const fetchSale = useCallback(async () => {
    try {
      const response = await fetch(`/api/direct-sales/${saleId}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setSale(data);
    } catch (error) {
      console.error("Error fetching sale:", error);
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    fetchSale();
  }, [fetchSale]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">Cargando...</div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">Venta no encontrada</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title={`Venta #${sale.id.slice(-6)}`}
        titleClassName="font-mono"
        description={`Detalle de la venta realizada a ${sale.customerName}`}
        showBackButton
        onBack={() => window.history.back()}
      >
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 font-mono font-bold text-sm">
            {formatCurrency(sale.total)}
          </Badge>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-medium text-muted-foreground font-mono">
            <Calendar className="h-3.5 w-3.5 pointer-events-none" aria-hidden="true" />
            {new Date(sale.createdAt).toLocaleDateString('es-AR')}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-medium text-muted-foreground font-mono">
            <Package className="h-3.5 w-3.5 pointer-events-none" aria-hidden="true" />
            {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      </Header>

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary pointer-events-none" aria-hidden="true" />
            Información del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha</div>
              <div className="font-mono text-sm flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/50 border w-fit">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {new Date(sale.createdAt).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
                <Clock className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                {new Date(sale.createdAt).toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</div>
              <div className="font-mono font-bold text-xl text-emerald-700">
                {formatCurrency(sale.total)}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cliente</div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-primary pointer-events-none" aria-hidden="true" />
                </div>
                {sale.customer ? (
                  <Link href={`/adm/customers/${sale.customer.id}`} className="font-semibold tracking-tight hover:underline underline-offset-4 decoration-primary/30">
                    {sale.customer.name}
                  </Link>
                ) : (
                  <span className="font-semibold tracking-tight">{sale.customerName}</span>
                )}
              </div>
            </div>
            {sale.customer && (
              <div className="grid grid-cols-2 gap-4">
                {sale.customer.phone && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Teléfono</div>
                    <div className="text-sm font-mono">{sale.customer.phone}</div>
                  </div>
                )}
                {sale.customer.email && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="text-sm font-mono truncate max-w-[200px]">{sale.customer.email}</div>
                  </div>
                )}
              </div>
            )}
          </div>
          {sale.notes && (
            <div className="pt-4 border-t">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Notas</div>
              <div className="text-sm bg-muted/30 p-3 rounded-lg border border-dashed italic text-muted-foreground">
                &ldquo;{sale.notes}&rdquo;
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary pointer-events-none" aria-hidden="true" />
            Items de la Venta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sale.items.map((item) => {
              const Icon = item.serviceId ? Clock : Package;
              return (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 shadow-sm flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary pointer-events-none" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="font-semibold tracking-tight">{item.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{item.quantity} u.</span>
                        <span>×</span>
                        <span className="font-mono">{formatCurrency(item.unitPrice)}</span>
                      </div>
                      {item.product && item.product.sku && (
                        <div className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-widest bg-muted/50 w-fit px-1.5 rounded">
                          SKU: {item.product.sku}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-lg">
                    {formatCurrency(item.totalPrice)}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-dashed font-bold text-xl mt-4">
              <span className="text-muted-foreground text-sm uppercase tracking-widest font-semibold">Total General</span>
              <span className="font-mono text-emerald-700">{formatCurrency(sale.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary pointer-events-none" aria-hidden="true" />
            Pagos Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sale.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="font-semibold tracking-tight">{payment.paymentMethod.name}</div>
                    <Badge variant="outline" className="mt-1 font-mono text-[10px] uppercase tracking-tighter border-emerald-200 bg-emerald-50 text-emerald-700">
                      {payment.paymentMethod.code}
                    </Badge>
                    {payment.notes && (
                      <div className="text-xs text-muted-foreground mt-1 italic">
                        {payment.notes}
                      </div>
                    )}
                  </div>
                </div>
                <div className="font-mono font-bold text-emerald-700 text-lg">
                  {formatCurrency(payment.amount)}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-xl border border-emerald-100 font-bold text-xl mt-4">
              <span className="text-emerald-700/60 text-sm uppercase tracking-widest font-semibold">Total Recaudado</span>
              <span className="font-mono text-emerald-700">{formatCurrency(sale.payments.reduce((sum, p) => sum + p.amount, 0))}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
