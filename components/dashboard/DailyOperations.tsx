'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { formatARS } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar, ArrowUpCircle, ArrowDownCircle, DollarSign, RefreshCw, Eye } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DailyOperationsData {
  movements: Array<{
    id: string;
    type: 'INCOME' | 'EXPENSE' | 'OPENING' | 'CLOSING' | 'ADJUSTMENT';
    amount: number;
    method: string;
    methodName: string;
    referenceId?: string;
    referenceType?: string;
    reason?: string;
    createdAt: string;
    customer?: { id: string; name: string };
    relatedId?: string;
    relatedType?: 'work_order' | 'direct_sale';
  }>;
  summary: {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
  };
}

export function DailyOperations() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<DailyOperationsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOperations = useCallback(async (targetDate: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/operations?date=${targetDate}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching operations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchOperations(date);
    }, 0);
    return () => clearTimeout(timer);
  }, [date, fetchOperations]);

  const columns: ColumnDef<DailyOperationsData['movements'][0]>[] = useMemo(() => [
    {
      accessorKey: 'createdAt',
      header: 'Hora',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.original.type;
        const labels: Record<string, string> = {
          INCOME: 'Ingreso',
          EXPENSE: 'Egreso',
          OPENING: 'Apertura',
          CLOSING: 'Cierre',
          ADJUSTMENT: 'Ajuste',
        };

        const colors: Record<string, string> = {
          INCOME: 'bg-green-50 text-green-700 border-green-200',
          EXPENSE: 'bg-red-50 text-red-700 border-red-200',
          OPENING: 'bg-blue-50 text-blue-700 border-blue-200',
          CLOSING: 'bg-slate-50 text-slate-700 border-slate-200',
          ADJUSTMENT: 'bg-amber-50 text-amber-700 border-amber-200',
        };

        return (
          <Badge variant="outline" className={cn("font-medium", colors[type])}>
            {labels[type] || type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'customer.name',
      header: 'Cliente',
      cell: ({ row }) => row.original.customer?.name || '-',
    },
    {
      accessorKey: 'reason',
      header: 'Referencia',
      cell: ({ row }) => {
        const reason = row.original.reason;
        if (!reason) return '-';
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="max-w-[200px] truncate cursor-help">
                {reason}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {reason}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'methodName',
      header: 'Método',
    },
    {
      accessorKey: 'amount',
      header: 'Monto',
      cell: ({ row }) => {
        const amount = row.original.amount;
        const isExpense = row.original.type === 'EXPENSE';
        return (
          <span className={isExpense ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
            {isExpense ? '-' : '+'}{formatARS(amount)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const { relatedId, relatedType } = row.original;
        if (!relatedId || !relatedType) return null;

        const href = relatedType === 'work_order'
          ? `/adm/work-orders/${relatedId}`
          : `/adm/customers?id=${relatedId}`;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link href={href} aria-label="Ver detalle de la operación">
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Ver detalle</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver detalle</TooltipContent>
          </Tooltip>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1 shadow-sm w-fit">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-0 focus-visible:ring-0 h-8 w-40 bg-transparent p-0"
            aria-label="Seleccionar fecha de operaciones"
          />
        </div>
        <Button
          onClick={() => fetchOperations(date)}
          loading={loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {!loading && <RefreshCw className="h-4 w-4" />}
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatARS(data?.summary.totalIncome || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatARS(data?.summary.totalExpense || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(data?.summary.netAmount || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatARS(data?.summary.netAmount || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            Operaciones del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.movements || []}
            pageSize={50}
          />
        </CardContent>
      </Card>
    </div>
  );
}
