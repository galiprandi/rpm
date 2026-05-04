"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Receipt, User, Calendar, CreditCard, Package } from "lucide-react";
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
    <div className="container mx-auto py-6 space-y-6">
      <Header
        title={`Venta #${sale.id.slice(-6)}`}
        description={`Cliente: ${sale.customerName}`}
        primaryAction={{
          label: "Volver",
          onClick: () => window.history.back(),
          icon: ArrowLeft,
        }}
      />

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Información de la Venta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Fecha</div>
              <div className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(sale.createdAt).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="font-bold text-xl">{formatCurrency(sale.total)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Cliente</div>
              <div className="font-medium flex items-center gap-1">
                <User className="h-4 w-4" />
                {sale.customer ? (
                  <Link href={`/adm/customers/${sale.customer.id}`} className="hover:underline">
                    {sale.customer.name}
                  </Link>
                ) : (
                  sale.customerName
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Items</div>
              <div className="font-medium flex items-center gap-1">
                <Package className="h-4 w-4" />
                {sale.items.length}
              </div>
            </div>
          </div>
          {sale.notes && (
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">Notas</div>
              <div className="text-sm">{sale.notes}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Items de la Venta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sale.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </div>
                  {item.product && (
                    <div className="text-xs text-muted-foreground">
                      SKU: {item.product.sku || 'N/A'}
                    </div>
                  )}
                </div>
                <div className="font-semibold">{formatCurrency(item.totalPrice)}</div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sale.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{payment.paymentMethod.name}</div>
                  {payment.notes && (
                    <div className="text-sm text-muted-foreground">{payment.notes}</div>
                  )}
                </div>
                <Badge variant="outline" className="mr-2">
                  {payment.paymentMethod.code}
                </Badge>
                <div className="font-semibold">{formatCurrency(payment.amount)}</div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t font-bold text-lg">
              <span>Total Pagado</span>
              <span>{formatCurrency(sale.payments.reduce((sum, p) => sum + p.amount, 0))}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
