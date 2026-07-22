'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Header, CrudStats } from '@/components/adm';
import { DataTable } from '@/components/ui/data-table';
import { FileText, Search, RefreshCw, Send, Download, Eye, XCircle, Calendar, X, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { formatARS } from '@/lib/utils/format';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const stats = useMemo(() => {
    const totalCount = invoices.length;

    const issuedInvoices = invoices.filter((inv) => inv.status === 'ISSUED');
    const totalIssuedAmount = issuedInvoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0,
    );

    const pendingInvoices = invoices.filter(
      (inv) => inv.status === 'DRAFT' || inv.status === 'REJECTED',
    );
    const totalPendingAmount = pendingInvoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0,
    );

    const rejectedCount = invoices.filter(
      (inv) => inv.status === 'REJECTED',
    ).length;

    return [
      {
        label: 'Total comprobantes',
        value: totalCount,
        icon: FileText,
        iconColor: '#64748b', // slate-500
      },
      {
        label: 'Oficializado',
        value: formatARS(totalIssuedAmount),
        icon: CheckCircle2,
        iconColor: '#15803d', // green-700
      },
      {
        label: 'Pendiente (X)',
        value: formatARS(totalPendingAmount),
        icon: Clock,
        iconColor: '#b45309', // amber-700
      },
      {
        label: 'Rechazado por AFIP',
        value: rejectedCount,
        icon: AlertTriangle,
        iconColor: '#b91c1c', // red-700
      },
    ];
  }, [invoices]);

  const fetchInvoices = async (searchOverride?: string) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);

      const searchVal = searchOverride !== undefined ? searchOverride : filters.search;
      if (searchVal) queryParams.append('search', searchVal);

      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

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

  const handleClearSearch = () => {
    setFilters({ ...filters, search: '' });
    fetchInvoices('');
  };

  useEffect(() => {
    fetchInvoices();
  }, [filters.type, filters.status, filters.startDate, filters.endDate]);

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
            <div className="flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 uppercase tracking-wider ml-11 w-fit">
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

  const handleOfficialize = async (id: string, silent = false) => {
    const toastId = silent ? null : toast.loading('Oficializando comprobante ante AFIP...');
    try {
      const response = await fetch(`/api/invoices/${id}/officialize`, {
        method: 'POST',
      });

      if (response.ok) {
        if (!silent) toast.success('Comprobante oficializado con éxito', { id: toastId! });
        return { success: true };
      } else {
        const error = await response.json();
        if (!silent) toast.error(error.error || 'Error al oficializar', { id: toastId! });
        return { success: false, error: error.error };
      }
    } catch (error) {
      console.error('Error officializing invoice:', error);
      if (!silent) toast.error('Error de conexión', { id: toastId! });
      return { success: false, error: 'Error de conexión' };
    }
  };

  const handleBatchCancel = async () => {
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    const eligibleInvoices = invoices.filter(inv =>
      selectedIds.includes(inv.id) && (inv.status === 'DRAFT' || inv.status === 'REJECTED')
    );

    if (eligibleInvoices.length === 0) {
      toast.error('No hay comprobantes seleccionados aptos para cancelar');
      return;
    }

    if (!confirm(`¿Está seguro de que desea cancelar ${eligibleInvoices.length} comprobantes? Esta acción no se puede deshacer.`)) {
      return;
    }

    const toastId = toast.loading(`Cancelando ${eligibleInvoices.length} comprobantes...`);
    let successCount = 0;
    let failCount = 0;

    for (const inv of eligibleInvoices) {
      try {
        const response = await fetch(`/api/invoices/${inv.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CANCELLED' }),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('Error cancelling invoice:', error);
        failCount++;
      }
      await new Promise(r => setTimeout(r, 100));
    }

    if (failCount === 0) {
      toast.success(`Se cancelaron ${successCount} comprobantes con éxito`, { id: toastId });
    } else {
      toast.error(`Proceso terminado: ${successCount} éxitos, ${failCount} errores`, { id: toastId });
    }

    setRowSelection({});
    fetchInvoices();
  };

  const handleBatchOfficialize = async () => {
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    const eligibleInvoices = invoices.filter(inv =>
      selectedIds.includes(inv.id) &&
      (inv.status === 'DRAFT' || inv.status === 'REJECTED') &&
      (inv.type.startsWith('X_') || inv.type.startsWith('NOTA_CREDITO_X_'))
    );

    if (eligibleInvoices.length === 0) {
      toast.error('No hay comprobantes seleccionados aptos para oficializar');
      return;
    }

    const toastId = toast.loading(`Procesando ${eligibleInvoices.length} comprobantes...`);
    let successCount = 0;
    let failCount = 0;

    for (const inv of eligibleInvoices) {
      const result = await handleOfficialize(inv.id, true);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
      // Brief pause to allow UI update and avoid hitting AFIP too rapidly
      await new Promise(r => setTimeout(r, 200));
    }

    if (failCount === 0) {
      toast.success(`Se oficializaron ${successCount} comprobantes con éxito`, { id: toastId });
    } else {
      toast.error(`Proceso terminado: ${successCount} éxitos, ${failCount} errores`, { id: toastId });
    }

    setRowSelection({});
    fetchInvoices();
  };

  const rowActions = (row: any) => (
    <div className="flex items-center gap-1">
      <Link href={`/adm/invoices/${row.id}`}>
        <button
          className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
          title="Ver Detalle"
        >
          <Eye className="h-4 w-4" />
        </button>
      </Link>
      <button
        className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
        title="Imprimir / PDF"
        onClick={() => {
          window.open(`/adm/invoices/${row.id}?print=true`, '_blank');
        }}
      >
        <Download className="h-4 w-4" />
      </button>
      {(row.status === 'DRAFT' || row.status === 'REJECTED') && (row.type.startsWith('X_') || row.type.startsWith('NOTA_CREDITO_X_')) && (
        <button
          className="p-2 hover:bg-primary/10 rounded-md transition-colors text-primary"
          title="Enviar a AFIP"
          onClick={() => handleOfficialize(row.id)}
        >
          <Send className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  const eligibleSelectedCount = invoices.filter(inv =>
    rowSelection[inv.id] &&
    (inv.status === 'DRAFT' || inv.status === 'REJECTED') &&
    (inv.type.startsWith('X_') || inv.type.startsWith('NOTA_CREDITO_X_'))
  ).length;

  const cancellableSelectedCount = invoices.filter(inv =>
    rowSelection[inv.id] && (inv.status === 'DRAFT' || inv.status === 'REJECTED')
  ).length;

  const headerActions = [];
  if (eligibleSelectedCount > 0) {
    headerActions.push({
      label: `Oficializar (${eligibleSelectedCount})`,
      icon: Send,
      onClick: handleBatchOfficialize
    });
  }
  if (cancellableSelectedCount > 0) {
    headerActions.push({
      label: `Cancelar (${cancellableSelectedCount})`,
      icon: XCircle,
      onClick: handleBatchCancel,
      variant: 'outline' as const
    });
  }

  const handleExportCSV = () => {
    if (invoices.length === 0) {
      toast.error('No hay comprobantes para exportar');
      return;
    }

    const headers = [
      'Número',
      'Tipo',
      'Cliente',
      'Tipo Doc.',
      'Número Doc.',
      'Fecha',
      'Subtotal',
      'IVA 21%',
      'IVA 10.5%',
      'Total',
      'Estado',
      'CAE',
      'Vto. CAE'
    ];

    const rows = invoices.map((inv) => {
      const typeStr = inv.type.replace(/_/g, ' ');
      const dateStr = format(new Date(inv.createdAt), 'dd/MM/yyyy HH:mm', { locale: es });
      const vtoCae = inv.afipData?.caeVencimiento
        ? format(new Date(inv.afipData.caeVencimiento), 'dd/MM/yyyy', { locale: es })
        : '';

      return [
        inv.number || '',
        typeStr,
        inv.customerName || '',
        inv.customerDocType || '',
        inv.customerDoc || '',
        dateStr,
        Number(inv.subtotal || 0).toFixed(2),
        Number(inv.iva21 || 0).toFixed(2),
        Number(inv.iva105 || 0).toFixed(2),
        Number(inv.total || 0).toFixed(2),
        inv.status || '',
        inv.afipData?.cae || '',
        vtoCae
      ];
    });

    const csvContent = "\ufeff" + [
      headers.join(","),
      ...rows.map((r) => r.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `comprobantes_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Comprobantes exportados con éxito');
  };

  const secondaryActions = [
    ...headerActions.slice(1),
    {
      label: 'Exportar CSV',
      icon: Download,
      onClick: handleExportCSV,
      variant: 'outline' as const,
      disabled: invoices.length === 0,
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Comprobantes"
        description="Gestión de facturación, presupuestos y remitos"
        primaryAction={headerActions[0]}
        secondaryActions={secondaryActions}
      />

      <CrudStats stats={stats} />

      <div className="bg-background border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4 bg-muted/5">
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar por número o cliente..."
                className="w-full pl-10 pr-8 py-2 text-sm font-mono"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
              />
              {filters.search && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={handleClearSearch}
                  title="Limpiar búsqueda"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4 pointer-events-none" />
                </button>
              )}
            </div>
            <button
              onClick={() => fetchInvoices()}
              className="p-2 hover:bg-background border rounded-lg transition-colors shadow-sm cursor-pointer"
              title="Refrescar"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filtros de Fecha */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Desde:</span>
              <input
                type="date"
                className="px-2 py-1.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Hasta:</span>
              <input
                type="date"
                className="px-2 py-1.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            {(filters.startDate || filters.endDate) && (
              <button
                onClick={() => setFilters({ ...filters, startDate: '', endDate: '' })}
                className="p-1.5 hover:bg-background border rounded-lg transition-colors shadow-sm text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 cursor-pointer"
                title="Limpiar fechas"
              >
                <X className="h-3.5 w-3.5" />
                <span>Limpiar fechas</span>
              </button>
            )}

            <div className="h-4 w-px bg-border hidden sm:block mx-1" />

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
              <option value="NOTA_CREDITO_X_A">NC Preliminar A</option>
              <option value="NOTA_CREDITO_X_B">NC Preliminar B</option>
              <option value="NOTA_CREDITO_A">Nota de Crédito A</option>
              <option value="NOTA_CREDITO_B">Nota de Crédito B</option>
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
              enableRowSelection
              getRowId={(row) => row.id}
              rowSelection={rowSelection}
              onRowSelectionStateChange={setRowSelection}
            />
          )}
        </div>
      </div>
    </div>
  );
}
