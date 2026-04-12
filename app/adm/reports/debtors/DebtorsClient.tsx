'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUI } from '@/components/ui/UIProvider';
import { TrendingDown, Users, Receipt, DollarSign, Phone } from 'lucide-react';
import Link from 'next/link';

interface Debtor {
  customerId: string;
  customerName: string;
  phone: string | null;
  email: string | null;
  balance: number;
  workOrderCount: number;
  oldestDebtDate: string | null;
  pendingWorkOrdersTotal: number;
  vehicles: string[];
  recentWorkOrders: Array<{
    id: string;
    createdAt: string;
    total: number;
    status: string;
  }>;
}

interface Summary {
  totalDebt: number;
  totalCustomers: number;
  totalWorkOrders: number;
  averageDebt: number;
}

export default function DebtorsClient() {
  const { alert } = useUI();
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'amount' | 'oldest' | 'newest'>('amount');

  const fetchDebtors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/debtors?sortBy=${sortBy}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setDebtors(data.debtors || []);
        setSummary(data.summary || null);
      } else {
        const error = await res.json();
        await alert({
          title: 'Error',
          description: error.error || 'No se pudo cargar el reporte',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching debtors:', error);
      await alert({
        title: 'Error',
        description: 'Error al cargar el reporte de deudores',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [sortBy, alert]);

  useEffect(() => {
    fetchDebtors();
  }, [fetchDebtors]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const getDaysSince = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reporte de Deudores</h1>
          <p className="text-muted-foreground">
            Clientes con saldo pendiente de pago
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'amount' | 'oldest' | 'newest')}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="amount">Mayor Deuda</option>
            <option value="oldest">Más Antiguo</option>
            <option value="newest">Más Reciente</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalDebt)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Deudores</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OTs Impagas</CardTitle>
              <Receipt className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalWorkOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deuda Promedio</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.averageDebt)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Debtors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Deudores</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando reporte...</div>
          ) : debtors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay clientes con deuda pendiente
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium">Vehículos</th>
                    <th className="text-center py-3 px-4 font-medium"># OTs</th>
                    <th className="text-right py-3 px-4 font-medium">Deuda Total</th>
                    <th className="text-left py-3 px-4 font-medium">Deuda Más Antigua</th>
                    <th className="text-center py-3 px-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {debtors.map((debtor) => {
                    const daysSince = getDaysSince(debtor.oldestDebtDate);
                    return (
                      <tr key={debtor.customerId} className="border-t hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{debtor.customerName}</div>
                          {debtor.phone && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {debtor.phone}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs">
                            {debtor.vehicles.slice(0, 2).join(', ')}
                            {debtor.vehicles.length > 2 && ` +${debtor.vehicles.length - 2}`}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {debtor.workOrderCount}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <div className="font-bold text-red-600">
                            {formatCurrency(debtor.balance)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">{formatDate(debtor.oldestDebtDate)}</div>
                          {daysSince && (
                            <div className={`text-xs ${daysSince > 30 ? 'text-red-600' : 'text-muted-foreground'}`}>
                              {daysSince} días
                            </div>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          <Link href={`/adm/customers/${debtor.customerId}`}>
                            <Button variant="outline" size="sm">
                              Ver Cliente
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
