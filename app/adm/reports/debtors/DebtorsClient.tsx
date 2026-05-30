'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUI } from '@/components/ui/UIProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Header, CrudStats } from '@/components/adm';
import { TrendingDown, Users, Receipt, DollarSign, Phone, Eye, Clock } from 'lucide-react';
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

  const stats = summary ? [
    {
      label: 'Deuda Total',
      value: formatCurrency(summary.totalDebt),
      icon: TrendingDown,
      iconColor: '#ef4444', // red-500
    },
    {
      label: 'Clientes Deudores',
      value: summary.totalCustomers,
      icon: Users,
      iconColor: '#3b82f6', // blue-500
    },
    {
      label: 'OTs Impagas',
      value: summary.totalWorkOrders,
      icon: Receipt,
      iconColor: '#f59e0b', // amber-500
    },
    {
      label: 'Deuda Promedio',
      value: formatCurrency(summary.averageDebt),
      icon: DollarSign,
      iconColor: '#9333ea', // purple-600
    },
  ] : [];

  return (
    <div className="space-y-6">
      <Header
        title="Reporte de Deudores"
        description="Clientes con saldo pendiente de pago"
        leftActions={
          <div key="sort-select" className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ordenar por:</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'amount' | 'oldest' | 'newest')}>
              <SelectTrigger className="w-44 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amount">Mayor Deuda</SelectItem>
                <SelectItem value="oldest">Más Antiguo</SelectItem>
                <SelectItem value="newest">Más Reciente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <CrudStats stats={stats} />

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
                    <th className="text-center py-3 px-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {debtors.map((debtor) => {
                    const daysSince = getDaysSince(debtor.oldestDebtDate);
                    return (
                      <tr key={debtor.customerId} className="border-t hover:bg-muted/30 transition-colors group">
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
                          <div className="text-xs text-muted-foreground">
                            {debtor.vehicles.slice(0, 2).join(', ')}
                            {debtor.vehicles.length > 2 && ` +${debtor.vehicles.length - 2}`}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {debtor.workOrderCount}
                          </Badge>
                        </td>
                        <td className="text-right py-3 px-4">
                          <div className="font-bold text-red-600">
                            {formatCurrency(debtor.balance)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(debtor.oldestDebtDate)}
                          </div>
                          {daysSince && (
                            <div className={`text-xs font-medium ${daysSince > 30 ? 'text-red-600' : 'text-muted-foreground'}`}>
                              {daysSince} días
                            </div>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/adm/customers/${debtor.customerId}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Ver cliente">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>Ver cliente</TooltipContent>
                          </Tooltip>
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
