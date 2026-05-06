'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { formatARS } from '@/lib/utils/format';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  Calendar as CalendarIcon,
  ExternalLink,
  Receipt,
  User,
  Wrench,
  ShoppingCart,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DailyOperationsData } from '@/lib/services/dashboardService';
import { cn } from '@/lib/utils';

export function DailyOperations() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<DailyOperationsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOperations = async (selectedDate: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/operations?date=${selectedDate}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Error fetching daily operations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations(date);
  }, [date]);

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
        const config: Record<string, { label: string; icon: any; color: string }> = {
          INCOME: { label: 'Ingreso', icon: ArrowUpCircle, color: 'text-green-600' },
          EXPENSE: { label: 'Egreso', icon: ArrowDownCircle, color: 'text-red-600' },
          OPENING: { label: 'Apertura', icon: DollarSign, color: 'text-blue-600' },
          CLOSING: { label: 'Cierre', icon: DollarSign, color: 'text-slate-600' },
        };
        const { label, icon: Icon, color } = config[type] || { label: type, icon: DollarSign, color: '' };
        return (
          <div className={cn("flex items-center gap-2 font-medium", color)}>
            <Icon className="h-4 w-4" />
            {label}
          </div>
        );
      },
    },
    {
      accessorKey: 'customer',
      header: 'Cliente',
      cell: ({ row }) => {
        const customer = row.original.customer;
        if (!customer) return <span className="text-muted-foreground">-</span>;
        if (!customer.id) return <span>{customer.name}</span>;
        return (
          <Link
            href={`/adm/customers/${customer.id}`}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <User className="h-3 w-3" />
            {customer.name}
          </Link>
        );
      },
    },
    {
      accessorKey: 'relatedId',
      header: 'Referencia',
      cell: ({ row }) => {
        const { relatedId, relatedType, referenceType, reason } = row.original;
        if (relatedType === 'work_order' && relatedId) {
          return (
            <Link
              href={`/adm/work-orders/${relatedId}`}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Wrench className="h-3 w-3" />
              OT #{relatedId.slice(-6).toUpperCase()}
            </Link>
          );
        }
        if (relatedType === 'direct_sale' && relatedId) {
          return (
            <div className="flex items-center gap-1 text-slate-600">
              <ShoppingCart className="h-3 w-3" />
              Venta Rápida
            </div>
          );
        }
        return <span className="text-xs text-muted-foreground">{reason || referenceType || '-'}</span>;
      },
    },
    {
      accessorKey: 'methodName',
      header: 'Método',
      cell: ({ row }) => <Badge variant="outline">{row.original.methodName}</Badge>,
    },
    {
      accessorKey: 'amount',
      header: 'Monto',
      cell: ({ row }) => {
        const isExpense = row.original.type === 'EXPENSE';
        return (
          <span className={cn("font-bold", isExpense ? "text-red-600" : "text-green-600")}>
            {isExpense ? '-' : '+'}{formatARS(row.original.amount)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const { relatedId, relatedType, customer, type } = row.original;

        return (
          <div className="flex items-center gap-2">
             {customer?.id && (
               <Button variant="ghost" size="sm" asChild title="Ver Cliente">
                 <Link href={`/adm/customers/${customer.id}`}>
                   <User className="h-4 w-4" />
                 </Link>
               </Button>
             )}
             {relatedId && (
               <Button variant="ghost" size="sm" asChild title="Ver Detalle">
                 <Link href={relatedType === 'work_order' ? `/adm/work-orders/${relatedId}` : '#'}>
                   <ExternalLink className="h-4 w-4" />
                 </Link>
               </Button>
             )}
             {type === 'INCOME' && relatedId && (
               <Button
                variant="ghost"
                size="sm"
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                title="Generar NC (Próximamente)"
                onClick={() => alert('La funcionalidad de Nota de Crédito se debe realizar desde la ficha del cliente según la especificación actual.')}
              >
                 <RotateCcw className="h-4 w-4" />
               </Button>
             )}
          </div>
        );
      }
    }
  ], []);

  return (
    <div className="space-y-6">
      {/* Selector de Fecha y Métricas rápidas */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
          <CalendarIcon className="h-4 w-4 text-muted-foreground ml-2" />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-none focus-visible:ring-0 w-40"
          />
        </div>

        {data && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1 md:flex-none">
             <Card className="bg-green-50/50 border-green-100">
                <CardContent className="p-3">
                  <p className="text-xs text-green-600 font-medium uppercase">Ingresos</p>
                  <p className="text-lg font-bold text-green-700">{formatARS(data.summary.totalIncome)}</p>
                </CardContent>
             </Card>
             <Card className="bg-red-50/50 border-red-100">
                <CardContent className="p-3">
                  <p className="text-xs text-red-600 font-medium uppercase">Egresos</p>
                  <p className="text-lg font-bold text-red-700">{formatARS(data.summary.totalExpense)}</p>
                </CardContent>
             </Card>
             <Card className="bg-blue-50/50 border-blue-100 hidden md:block">
                <CardContent className="p-3">
                  <p className="text-xs text-blue-600 font-medium uppercase">Saldo Neto</p>
                  <p className="text-lg font-bold text-blue-700">{formatARS(data.summary.netAmount)}</p>
                </CardContent>
             </Card>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            Operaciones del Día
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => fetchOperations(date)}>
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.movements || []}
            pageSize={10}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
