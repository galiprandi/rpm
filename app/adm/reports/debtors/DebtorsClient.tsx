'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUI } from '@/components/ui/UIProvider';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';
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
import { TrendingDown, Users, Receipt, DollarSign, Phone, Eye, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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

  const columns: ColumnDef<Debtor>[] = useMemo(() => [
    {
      accessorKey: 'customerName',
      header: 'Cliente',
      cell: ({ row }) => {
        const debtor = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center">
              <User className="h-4 w-4 text-primary pointer-events-none" aria-hidden="true" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">{debtor.customerName}</div>
              {debtor.phone && (
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                  <Phone className="h-3 w-3 pointer-events-none" aria-hidden="true" />
                  {debtor.phone}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'vehicles',
      header: 'Vehículos',
      cell: ({ row }) => {
        const vehicles = row.original.vehicles;
        if (!vehicles.length) return '-';
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {vehicles.slice(0, 2).map((plate) => (
              <Badge key={plate} variant="outline" className="font-mono text-[10px] px-1 py-0 h-4 bg-muted/50">
                {plate}
              </Badge>
            ))}
            {vehicles.length > 2 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                +{vehicles.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'workOrderCount',
      header: '# OTs',
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono text-xs">
          {row.original.workOrderCount}
        </Badge>
      ),
    },
    {
      accessorKey: 'balance',
      header: 'Deuda Total',
      cell: ({ row }) => (
        <div className="font-mono font-bold text-red-600">
          {formatCurrency(row.original.balance)}
        </div>
      ),
    },
    {
      accessorKey: 'oldestDebtDate',
      header: 'Deuda Más Antigua',
      cell: ({ row }) => {
        const date = row.original.oldestDebtDate;
        const daysSince = getDaysSince(date);
        return (
          <div className="space-y-1">
            <div className="text-sm flex items-center gap-1.5 font-mono">
              <Clock className="h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden="true" />
              {formatDate(date)}
            </div>
            {daysSince && (
              <div className={cn(
                "text-xs font-medium",
                daysSince > 30 ? "text-red-600" : "text-muted-foreground"
              )}>
                {daysSince} días
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href={`/adm/customers/${row.original.customerId}`} aria-label="Ver cliente">
                <Eye className="h-4 w-4 pointer-events-none" aria-hidden="true" />
                <span className="sr-only">Ver cliente</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ver cliente</TooltipContent>
        </Tooltip>
      ),
    },
  ], []);

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

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={debtors}
            pageSize={50}
            emptyMessage={loading ? "Cargando reporte..." : "No hay clientes con deuda pendiente"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
