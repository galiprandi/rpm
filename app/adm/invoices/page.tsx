'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/adm/Header';
import { DataTable } from '@/components/ui/data-table';
import { FileText, Search, RefreshCw, Send, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { formatARS } from '@/lib/utils/format';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: '',
  });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/invoices?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        toast.error('Error al cargar comprobantes');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [filters.type, filters.status]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline" className="bg-yellow-50 text-amber-700 border-amber-200">X - Pendiente</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Enviando...</Badge>;
      case 'ISSUED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Oficializado</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rechazado</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelado</Badge>;
      case 'ANNULLED':
        return <Badge variant="outline" className="bg-red-50 text-red-900 border-red-300">Anulado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      header: 'Número',
      accessorKey: 'number',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0" aria-hidden="true">
              <FileText className="h-4 w-4 text-primary pointer-events-none" />
            </div>
            <span className="font-mono font-semibold tracking-tight">
              {row.original.number}
            </span>
          </div>
          {(row.original.type.startsWith('X_') || row.original.type.startsWith('NOTA_CREDITO_X_')) && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-orange-700 uppercase tracking-wider ml-11">
              <AlertCircle className="h-3 w-3" />
              <span>No válido como comprobante fiscal</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Tipo',
      accessorKey: 'type',
      cell: ({ row }) => (
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted">
          {row.original.type.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Cliente',
      accessorKey: 'customerName',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.customerName}</span>
          {row.original.customerDoc && (
            <span className="text-xs text-muted-foreground font-mono">
              {row.original.customerDocType}: {row.original.customerDoc}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Fecha',
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), 'dd/MM/yy HH:mm', { locale: es })}
        </span>
      ),
    },
    {
      header: 'Total',
      accessorKey: 'total',
      cell: ({ row }) => (
        <span className="font-mono font-medium text-sm">
          {formatARS(row.original.total)}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
  ];

  const rowActions = (row: any) => (
    <div className="flex items-center gap-1">
      <button
        className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
        title="Ver Detalle"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
        title="Descargar PDF"
      >
        <Download className="h-4 w-4" />
      </button>
      {row.status === 'DRAFT' && (
        <button
          className="p-2 hover:bg-primary/10 rounded-md transition-colors text-primary"
          title="Enviar a AFIP"
        >
          <Send className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Comprobantes"
        description="Gestión de facturación, presupuestos y remitos"
      />

      <div className="bg-background border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4 bg-muted/5">
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por número o cliente..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
              />
            </div>
            <button
              onClick={fetchInvoices}
              className="p-2 hover:bg-background border rounded-lg transition-colors shadow-sm"
              title="Refrescar"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <select
              className="px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">Todos los tipos</option>
              <option value="X_A">Pre-Factura A</option>
              <option value="X_B">Pre-Factura B</option>
              <option value="FACTURA_A">Factura A</option>
              <option value="FACTURA_B">Factura B</option>
              <option value="PRESUPUESTO">Presupuesto</option>
              <option value="REMITO">Remito</option>
            </select>

            <select
              className="px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Todos los estados</option>
              <option value="DRAFT">Pendiente (X)</option>
              <option value="ISSUED">Oficializado</option>
              <option value="REJECTED">Rechazado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="relative min-h-[400px] p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              data={invoices}
              columns={columns}
              rowActions={rowActions}
              emptyMessage="No se encontraron comprobantes"
            />
          )}
        </div>
      </div>
    </div>
  );
}
