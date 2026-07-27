'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Header, CrudStats } from '@/components/adm';
import { DataTable } from '@/components/ui/data-table';
import {
  FileText, Search, RefreshCw, Send, Download, Eye, XCircle,
  Calendar, X, CheckCircle2, Clock, AlertTriangle, SlidersHorizontal,
  AlertCircle, RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover, PopoverTrigger, PopoverContent,
} from '@/components/ui/popover';
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';
import { formatARS } from '@/lib/utils/format';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// --- Thin styled AlertDialog wrappers (radix-ui primitives) ---
const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;
function AlertDialogOverlay(props: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      {...props}
    />
  );
}
function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-background p-6 shadow-2xl outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          className,
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  );
}
function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={cn('text-base font-semibold leading-tight', className)}
      {...props}
    />
  );
}
function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn('text-sm text-muted-foreground leading-relaxed', className)}
      {...props}
    />
  );
}
const AlertDialogAction = AlertDialogPrimitive.Action;
const AlertDialogCancel = AlertDialogPrimitive.Cancel;

// --- AFIP error parser (UI-only, does not touch API/service logic) ---
function parseAfipError(errorData: any): {
  title: string;
  detail?: string;
  suggestion?: string;
} {
  const rawError =
    typeof errorData === 'string'
      ? errorData
      : errorData?.error || errorData?.message || '';
  const code = errorData?.code || errorData?.afipErrorCode;
  const lower = rawError.toLowerCase();

  if (
    lower.includes('conexion') ||
    lower.includes('connection') ||
    lower.includes('timeout') ||
    lower.includes('no se pudo conectar')
  ) {
    return {
      title: 'Sin conexión con AFIP',
      detail: rawError,
      suggestion:
        'No se pudo conectar con los servidores de AFIP. Intente nuevamente en unos momentos.',
    };
  }

  if (lower.includes('fecha') || lower.includes('date')) {
    return {
      title: code ? `Error de validación de fecha (Cód. ${code})` : 'Error de validación de fecha',
      detail: rawError,
      suggestion:
        'Verifique que la fecha del comprobante no sea anterior a la del último comprobante oficializado.',
    };
  }

  if (lower.includes('cae') || lower.includes('autorizado') || lower.includes('rechaz') || code) {
    return {
      title: code ? `AFIP rechazó el comprobante (Cód. ${code})` : 'AFIP rechazó el comprobante',
      detail: rawError,
      suggestion:
        'Revise los datos del cliente y del comprobante. Si el problema persiste, contacte al administrador del sistema.',
    };
  }

  return {
    title: 'Error al oficializar',
    detail: rawError || 'Ocurrió un error inesperado.',
    suggestion: 'Intente nuevamente. Si el problema persiste, contacte al administrador.',
  };
}

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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [loadError, setLoadError] = useState<{
    message: string;
    isTransient: boolean;
  } | null>(null);

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
    setLoadError(null);
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
        const isTransient = response.status >= 500;
        const message = isTransient
          ? 'El servidor no está disponible. Intente nuevamente en unos momentos.'
          : response.status === 404
            ? 'No se encontraron comprobantes con los filtros aplicados.'
            : 'No se pudieron cargar los comprobantes. Si el problema persiste, contacte al administrador.';
        setLoadError({ message, isTransient });
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setLoadError({
        message:
          'No se pudieron cargar los comprobantes. Verifique su conexión de red e intente nuevamente.',
        isTransient: true,
      });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.status, filters.startDate, filters.endDate]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
            X - Pendiente
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
            Enviando...
          </Badge>
        );
      case 'ISSUED':
        return (
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
            Oficializado
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
            Rechazado
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50">
            Cancelado
          </Badge>
        );
      case 'ANNULLED':
        return (
          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
            Anulado
          </Badge>
        );
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
        <span className="text-sm text-muted-foreground font-mono">
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
        const errorData = await response.json().catch(() => ({}));
        if (!silent) {
          const parsed = parseAfipError(errorData);
          const fullMessage = parsed.detail
            ? `${parsed.title}: ${parsed.detail}${parsed.suggestion ? ` — ${parsed.suggestion}` : ''}`
            : `${parsed.title}${parsed.suggestion ? ` — ${parsed.suggestion}` : ''}`;
          toast.error(fullMessage, { id: toastId! });
        }
        return { success: false, error: errorData?.error };
      }
    } catch (error) {
      console.error('Error officializing invoice:', error);
      if (!silent) {
        toast.error(
          'Sin conexión con AFIP. Verifique su conexión de red e intente nuevamente.',
          { id: toastId! },
        );
      }
      return { success: false, error: 'Error de conexión' };
    }
  };

  const handleBatchCancel = async () => {
    const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
    const eligibleInvoices = invoices.filter(
      (inv) =>
        selectedIds.includes(inv.id) && (inv.status === 'DRAFT' || inv.status === 'REJECTED'),
    );

    if (eligibleInvoices.length === 0) {
      toast.error('No hay comprobantes seleccionados aptos para cancelar');
      return;
    }

    setIsCancelDialogOpen(true);
  };

  const confirmBatchCancel = async () => {
    setIsCancelDialogOpen(false);

    const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
    const eligibleInvoices = invoices.filter(
      (inv) =>
        selectedIds.includes(inv.id) && (inv.status === 'DRAFT' || inv.status === 'REJECTED'),
    );

    if (eligibleInvoices.length === 0) return;

    const toastId = toast.loading(`Cancelando ${eligibleInvoices.length} comprobantes...`);
    let successCount = 0;
    let failCount = 0;
    const cancelledInvoices: Array<{ id: string; previousStatus: string }> = [];

    for (const inv of eligibleInvoices) {
      try {
        const response = await fetch(`/api/invoices/${inv.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CANCELLED' }),
        });

        if (response.ok) {
          successCount++;
          cancelledInvoices.push({ id: inv.id, previousStatus: inv.status });
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('Error cancelling invoice:', error);
        failCount++;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    if (failCount === 0) {
      toast.success(`Se cancelaron ${successCount} comprobantes con éxito`, {
        id: toastId,
        action: {
          label: 'Deshacer',
          onClick: () => void handleUndoBatchCancel(cancelledInvoices),
        },
        duration: 8000,
      });
    } else {
      toast.error(
        `Proceso terminado: ${successCount} éxitos, ${failCount} errores. Revise los comprobantes que no se pudieron cancelar.`,
        { id: toastId },
      );
    }

    setRowSelection({});
    fetchInvoices();
  };

  const handleUndoBatchCancel = async (
    cancelledInvoices: Array<{ id: string; previousStatus: string }>,
  ) => {
    if (cancelledInvoices.length === 0) return;

    const undoToastId = toast.loading(
      `Revirtiendo ${cancelledInvoices.length} cancelación(es)...`,
    );
    let successCount = 0;
    let failCount = 0;

    for (const inv of cancelledInvoices) {
      try {
        const response = await fetch(`/api/invoices/${inv.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: inv.previousStatus }),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('Error undoing cancel:', error);
        failCount++;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    if (failCount === 0) {
      toast.success(
        `Se revirtieron ${successCount} cancelación(es) con éxito`,
        { id: undoToastId },
      );
    } else {
      toast.error(
        `Proceso terminado: ${successCount} éxitos, ${failCount} errores. Algunos comprobantes siguen cancelados.`,
        { id: undoToastId },
      );
    }

    fetchInvoices();
  };

  const handleBatchOfficialize = async () => {
    const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
    const eligibleInvoices = invoices.filter(
      (inv) =>
        selectedIds.includes(inv.id) &&
        (inv.status === 'DRAFT' || inv.status === 'REJECTED') &&
        (inv.type.startsWith('X_') || inv.type.startsWith('NOTA_CREDITO_X_')),
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
      await new Promise((r) => setTimeout(r, 200));
    }

    if (failCount === 0) {
      toast.success(`Se oficializaron ${successCount} comprobantes con éxito`, { id: toastId });
    } else {
      toast.error(
        `Proceso terminado: ${successCount} éxitos, ${failCount} errores. Algunos comprobantes fueron rechazados por AFIP — revise el detalle de cada uno.`,
        { id: toastId },
      );
    }

    setRowSelection({});
    fetchInvoices();
  };

  const rowActions = (row: any) => (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={`/adm/invoices/${row.id}`}>
              <button
                className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">Ver Detalle</span>
              </button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>Ver Detalle</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
              onClick={() => {
                window.open(`/adm/invoices/${row.id}?print=true`, '_blank');
              }}
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Imprimir / PDF</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Imprimir / PDF</TooltipContent>
        </Tooltip>
        {(row.status === 'DRAFT' || row.status === 'REJECTED') && (row.type.startsWith('X_') || row.type.startsWith('NOTA_CREDITO_X_')) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-2 hover:bg-primary/10 rounded-md transition-colors text-primary"
                onClick={() => handleOfficialize(row.id)}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Enviar a AFIP</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Enviar a AFIP</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );

  const eligibleSelectedCount = invoices.filter(
    (inv) =>
      rowSelection[inv.id] &&
      (inv.status === 'DRAFT' || inv.status === 'REJECTED') &&
      (inv.type.startsWith('X_') || inv.type.startsWith('NOTA_CREDITO_X_')),
  ).length;

  const cancellableSelectedCount = invoices.filter(
    (inv) => rowSelection[inv.id] && (inv.status === 'DRAFT' || inv.status === 'REJECTED'),
  ).length;

  // Summary of comprobantes to cancel (for AlertDialog)
  const cancellableInvoices = invoices.filter(
    (inv) => rowSelection[inv.id] && (inv.status === 'DRAFT' || inv.status === 'REJECTED'),
  );
  const cancelSummaryByType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const inv of cancellableInvoices) {
      const label = inv.type.replace(/_/g, ' ');
      counts[label] = (counts[label] || 0) + 1;
    }
    return counts;
  }, [cancellableInvoices]);

  const headerActions: {
    label: string;
    icon: typeof Send;
    onClick: () => void;
    variant?: 'outline' | 'default' | 'destructive';
  }[] = [];
  if (eligibleSelectedCount > 0) {
    headerActions.push({
      label: `Oficializar (${eligibleSelectedCount})`,
      icon: Send,
      onClick: handleBatchOfficialize,
    });
  }
  if (cancellableSelectedCount > 0) {
    headerActions.push({
      label: `Cancelar (${cancellableSelectedCount})`,
      icon: XCircle,
      onClick: handleBatchCancel,
      variant: 'outline' as const,
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
      'Vto. CAE',
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
        vtoCae,
      ];
    });

    const csvContent =
      '\ufeff' +
      [
        headers.join(','),
        ...rows.map((r) =>
          r.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','),
        ),
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `comprobantes_${new Date().toISOString().split('T')[0]}.csv`,
    );
    link.style.visibility = 'hidden';
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
    },
  ];

  // Count active popover-managed filters (dates + type)
  const activePopoverFilterCount = [
    filters.startDate,
    filters.endDate,
    filters.type,
  ].filter(Boolean).length;

  const handleClearAllFilters = () => {
    setFilters({
      type: '',
      status: '',
      search: '',
      startDate: '',
      endDate: '',
    });
    fetchInvoices('');
  };

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
        {/* Filter bar: search + status always visible, rest in popover */}
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

            {/* Status filter — most used, stays inline */}
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value === '__all' ? '' : value })
              }
            >
              <SelectTrigger className="w-[180px]" aria-label="Filtrar por estado">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos los estados</SelectItem>
                <SelectItem value="DRAFT">Pendiente (X)</SelectItem>
                <SelectItem value="ISSUED">Oficializado</SelectItem>
                <SelectItem value="REJECTED">Rechazado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtros popover — dates + type + refresh */}
            <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Filtros</span>
                  {activePopoverFilterCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                      {activePopoverFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start" sideOffset={8}>
                <div className="space-y-4">
                  {/* Fechas group */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Fechas</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Desde</label>
                        <input
                          type="date"
                          className="w-full px-2 py-1.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                          value={filters.startDate}
                          onChange={(e) =>
                            setFilters({ ...filters, startDate: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Hasta</label>
                        <input
                          type="date"
                          className="w-full px-2 py-1.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                          value={filters.endDate}
                          onChange={(e) =>
                            setFilters({ ...filters, endDate: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    {(filters.startDate || filters.endDate) && (
                      <button
                        onClick={() =>
                          setFilters({ ...filters, startDate: '', endDate: '' })
                        }
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      >
                        <X className="h-3 w-3" />
                        Limpiar fechas
                      </button>
                    )}
                  </div>

                  {/* Tipo de comprobante group */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <FileText className="h-3.5 w-3.5" />
                      <span>Tipo de comprobante</span>
                    </div>
                    <Select
                      value={filters.type}
                      onValueChange={(value) =>
                        setFilters({ ...filters, type: value === '__all' ? '' : value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all">Todos los tipos</SelectItem>
                        <SelectGroup>
                          <SelectLabel>Facturas</SelectLabel>
                          <SelectItem value="X_A">Pre-Factura A</SelectItem>
                          <SelectItem value="X_B">Pre-Factura B</SelectItem>
                          <SelectItem value="FACTURA_A">Factura A</SelectItem>
                          <SelectItem value="FACTURA_B">Factura B</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Notas de Crédito</SelectLabel>
                          <SelectItem value="NOTA_CREDITO_X_A">NC Preliminar A</SelectItem>
                          <SelectItem value="NOTA_CREDITO_X_B">NC Preliminar B</SelectItem>
                          <SelectItem value="NOTA_CREDITO_A">Nota de Crédito A</SelectItem>
                          <SelectItem value="NOTA_CREDITO_B">Nota de Crédito B</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Otros</SelectLabel>
                          <SelectItem value="PRESUPUESTO">Presupuesto</SelectItem>
                          <SelectItem value="REMITO">Remito</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllFilters}
                      disabled={
                        !filters.startDate &&
                        !filters.endDate &&
                        !filters.type &&
                        !filters.status &&
                        !filters.search
                      }
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Limpiar todo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        fetchInvoices();
                        setIsFiltersOpen(false);
                      }}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                      Refrescar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Error banner with retry */}
        {loadError && !loading && (
          <div className="p-4 border-b bg-red-50 border-red-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{loadError.message}</span>
            </div>
            {loadError.isTransient && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchInvoices()}
                className="border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reintentar
              </Button>
            )}
          </div>
        )}

        <div className="relative min-h-[400px] p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : invoices.length === 0 && !loadError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">
                No se encontraron comprobantes
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ajuste los filtros o cree un nuevo comprobante desde una venta u OT.
              </p>
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

      {/* Cancel confirmation AlertDialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <div className="flex items-start gap-3.5">
            <div className="flex-shrink-0 rounded-lg bg-red-500/10 p-2.5">
              <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-2">
              <AlertDialogTitle>
                Cancelar {cancellableInvoices.length}{' '}
                {cancellableInvoices.length === 1 ? 'comprobante' : 'comprobantes'}
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  <p>
                    Está por cancelar los siguientes comprobantes. Esta acción no se puede
                    deshacer.
                  </p>
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    {Object.entries(cancelSummaryByType).map(([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-foreground">{type}</span>
                        <span className="font-mono text-muted-foreground">
                          {count} {count === 1 ? 'comprobante' : 'comprobantes'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </AlertDialogDescription>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4 mt-2">
            <AlertDialogCancel asChild>
              <Button variant="outline">No, mantener</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={confirmBatchCancel}>
                Sí, cancelar
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
