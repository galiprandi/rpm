'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalBase } from '@/components/ui/ModalBase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUI } from '@/components/ui/UIProvider';
import { Header, CrudStats } from '@/components/adm';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  History,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
} from 'lucide-react';

interface CashSummary {
  opening: number;
  income: number;
  expense: number;
  expected: number;
}

interface CashStatus {
  status: 'OPEN' | 'CLOSED';
  openedAt: string | null;
  openedBy: string | null;
  closedAt: string | null;
  summary: Record<string, CashSummary>;
  suggestedOpeningAmount: number;
}

interface HistoryRecord {
  id: string;
  date: string;
  openedAt: string;
  openedBy: string;
  openedById: string;
  responsibleBy: string;
  responsibleById: string;
  closedAt: string | null;
  closedBy: string | null;
  closedById: string | null;
  openingAmount: number;
  totalIncome: number;
  totalExpense: number;
  totalAdjustments: number;
  closingAmount: number | null;
  expectedAmount: number;
  difference: number;
  differenceReason: string | null;
  status: 'BALANCED' | 'SURPLUS' | 'SHORTAGE' | 'OPEN';
  isClosed: boolean;
}

interface PaymentMethod {
  code: string;
  name: string;
}

export default function CashClient() {
  const { alert } = useUI();
  const [cashStatus, setCashStatus] = useState<CashStatus | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);

  // Form states
  const [openingAmount, setOpeningAmount] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseMethod, setExpenseMethod] = useState('CASH');
  const [expenseReason, setExpenseReason] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeMethod, setIncomeMethod] = useState('CASH');
  const [incomeReason, setIncomeReason] = useState('');
  const [incomeNotes, setIncomeNotes] = useState('');
  const [differenceReason, setDifferenceReason] = useState('');
  const [counts, setCounts] = useState<Record<string, string>>({});

  // Responsible user state
  const [responsibleId, setResponsibleId] = useState('');
  const [staffUsers, setStaffUsers] = useState<{id: string, name: string, email: string}[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');

  // Tabs and history state
  const [activeTab, setActiveTab] = useState('status');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState<{
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/cash/status');
      if (res.ok) {
        const data = await res.json();
        setCashStatus(data);
        // Initialize counts from current values
        const initialCounts: Record<string, string> = {};
        Object.keys(data.summary || {}).forEach(method => {
          initialCounts[method] = String(data.summary[method]?.expected || 0);
        });
        setCounts(initialCounts);
      } else {
        await alert({
          title: 'Error',
          description: 'No se pudo cargar el estado de caja',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching cash status:', error);
    }
  }, [alert]);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const res = await fetch('/api/payment-methods');
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  }, []);

  const fetchStaffUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users?role=staff,admin&active=true');
      if (res.ok) {
        const data = await res.json();
        setStaffUsers(data.users || []);
        // Store current user ID from session
        const sessionRes = await fetch('/api/auth/session');
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          if (session?.user?.id) {
            setCurrentUserId(session.user.id);
            // Default responsible to current user
            setResponsibleId(session.user.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching staff users:', error);
    }
  }, []);

  const fetchHistory = useCallback(async (page: number = 1) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/cash/history?limit=10&page=${page}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        setHistoryPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchStatus();
    fetchPaymentMethods();
    fetchStaffUsers();
    fetchHistory(1);
    setLoading(false);
  }, [fetchStatus, fetchPaymentMethods, fetchHistory, fetchStaffUsers]);

  useEffect(() => {
    if (cashStatus?.suggestedOpeningAmount) {
      setOpeningAmount(String(cashStatus.suggestedOpeningAmount));
    }
  }, [cashStatus?.suggestedOpeningAmount]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory(historyPage);
    }
  }, [activeTab, historyPage, fetchHistory]);

  const handleOpenCash = async () => {
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) {
      await alert({
        title: 'Error',
        description: 'Ingrese un monto válido',
        variant: 'error',
      });
      return;
    }

    try {
      const res = await fetch('/api/cash/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, responsibleId }),
      });

      if (res.ok) {
        setIsOpenModalOpen(false);
        setOpeningAmount('');
        setResponsibleId(currentUserId); // Reset to current user
        fetchStatus();
      } else {
        const error = await res.json();
        await alert({
          title: 'Error',
          description: error.error || 'No se pudo abrir la caja',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error opening cash:', error);
      await alert({
        title: 'Error',
        description: 'Error al abrir la caja',
        variant: 'error',
      });
    }
  };

  const handleRegisterExpense = async () => {
    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      await alert({
        title: 'Error',
        description: 'Ingrese un monto válido mayor a 0',
        variant: 'error',
      });
      return;
    }

    if (!expenseReason.trim()) {
      await alert({
        title: 'Error',
        description: 'Ingrese un motivo para el egreso',
        variant: 'error',
      });
      return;
    }

    try {
      const res = await fetch('/api/cash/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method: expenseMethod,
          reason: expenseReason,
          notes: expenseNotes,
        }),
      });

      if (res.ok) {
        await alert({
          title: 'Éxito',
          description: 'Egreso registrado correctamente',
          variant: 'success',
        });
        setIsExpenseModalOpen(false);
        setExpenseAmount('');
        setExpenseReason('');
        setExpenseNotes('');
        fetchStatus();
      } else {
        const error = await res.json();
        await alert({
          title: 'Error',
          description: error.error || 'No se pudo registrar el egreso',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error registering expense:', error);
      await alert({
        title: 'Error',
        description: 'Error al registrar el egreso',
        variant: 'error',
      });
    }
  };

  const handleRegisterIncome = async () => {
    const amount = parseFloat(incomeAmount);
    if (isNaN(amount) || amount <= 0) {
      await alert({
        title: 'Error',
        description: 'Ingrese un monto válido mayor a 0',
        variant: 'error',
      });
      return;
    }

    if (!incomeReason.trim()) {
      await alert({
        title: 'Error',
        description: 'Ingrese un motivo para el ingreso',
        variant: 'error',
      });
      return;
    }

    try {
      const res = await fetch('/api/cash/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method: incomeMethod,
          reason: incomeReason,
          notes: incomeNotes,
        }),
      });

      if (res.ok) {
        await alert({
          title: 'Éxito',
          description: 'Ingreso registrado correctamente',
          variant: 'success',
        });
        setIsIncomeModalOpen(false);
        setIncomeAmount('');
        setIncomeReason('');
        setIncomeNotes('');
        fetchStatus();
      } else {
        const error = await res.json();
        await alert({
          title: 'Error',
          description: error.error || 'No se pudo registrar el ingreso',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error registering income:', error);
      await alert({
        title: 'Error',
        description: 'Error al registrar el ingreso',
        variant: 'error',
      });
    }
  };

  const handleCloseCash = async () => {
    const countsData: Record<string, number> = {};
    Object.entries(counts).forEach(([method, value]) => {
      countsData[method] = parseFloat(value) || 0;
    });

    // Check for differences
    let hasDifference = false;
    Object.entries(cashStatus?.summary || {}).forEach(([method, summary]) => {
      const expected = summary.expected;
      const counted = countsData[method] || 0;
      if (Math.abs(expected - counted) > 0.01) {
        hasDifference = true;
      }
    });

    if (hasDifference && (!differenceReason || differenceReason.trim().length < 5)) {
      await alert({
        title: 'Diferencias detectadas',
        description: 'Debe ingresar una explicación de al menos 5 caracteres para las diferencias encontradas',
        variant: 'error',
      });
      return;
    }

    try {
      const res = await fetch('/api/cash/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counts: countsData,
          differenceReason: hasDifference ? differenceReason : undefined,
        }),
      });

      if (res.ok) {
        setIsCloseModalOpen(false);
        setDifferenceReason('');
        fetchStatus();
      } else {
        const error = await res.json();
        await alert({
          title: 'Error',
          description: error.error || 'No se pudo cerrar la caja',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error closing cash:', error);
      await alert({
        title: 'Error',
        description: 'Error al cerrar la caja',
        variant: 'error',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };


  const getMethodName = (code: string) => {
    const method = paymentMethods.find(m => m.code === code);
    return method?.name || code;
  };

  const calculateDifference = (method: string) => {
    const expected = cashStatus?.summary[method]?.expected || 0;
    const counted = parseFloat(counts[method] || '0') || 0;
    return counted - expected;
  };

  const isOpen = cashStatus?.status === 'OPEN';

  const stats = useMemo(() => [
    {
      label: 'Apertura Efectivo',
      value: formatCurrency(cashStatus?.summary?.CASH?.opening || 0),
      icon: ArrowUpCircle,
      iconColor: '#10b981', // emerald-500
    },
    {
      label: 'Ingresos',
      value: formatCurrency(cashStatus?.summary?.CASH?.income || 0),
      icon: TrendingUp,
      iconColor: '#3b82f6', // blue-500
    },
    {
      label: 'Egresos',
      value: formatCurrency(cashStatus?.summary?.CASH?.expense || 0),
      icon: TrendingDown,
      iconColor: '#ef4444', // red-500
    },
    {
      label: 'Esperado Efectivo',
      value: formatCurrency(cashStatus?.summary?.CASH?.expected || 0),
      icon: Wallet,
      iconColor: '#9333ea', // purple-600
    }
  ], [cashStatus]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-10 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded-full"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>)}
        </div>
        <div className="h-[400px] bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title="Arqueo de Caja"
        description={cashStatus?.openedAt
          ? `Abierta desde: ${new Date(cashStatus.openedAt).toLocaleString('es-AR')}`
          : cashStatus?.closedAt
          ? `Cerrada el: ${new Date(cashStatus.closedAt).toLocaleString('es-AR')}`
          : 'Gestión de apertura, cierre y movimientos de caja'
        }
        leftActions={
          <div key="status-badge" className="flex items-center gap-2 mr-4">
             <Badge variant="outline" className={cn(
               "px-3 py-1 text-sm font-medium",
               isOpen ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200"
             )}>
                <span className={cn("h-2 w-2 rounded-full mr-2", isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400")}></span>
                {isOpen ? 'Caja Abierta' : 'Caja Cerrada'}
             </Badge>
          </div>
        }
        primaryAction={!isOpen ? {
          label: 'Abrir Caja',
          onClick: () => setIsOpenModalOpen(true),
          icon: ArrowUpCircle,
          className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          ariaLabel: 'Realizar apertura de caja'
        } : {
          label: 'Cerrar Caja',
          onClick: () => setIsCloseModalOpen(true),
          variant: 'destructive',
          icon: DollarSign,
          ariaLabel: 'Realizar cierre y arqueo de caja'
        }}
      />

      <CrudStats stats={stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="status" className="flex items-center gap-2 rounded-md transition-all">
            <LayoutDashboard className="h-4 w-4" />
            Estado
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 rounded-md transition-all">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6 mt-6 animate-in fade-in-50 duration-500">
           {isOpen && (
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsIncomeModalOpen(true)}
                className="bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                Registrar Ingreso
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsExpenseModalOpen(true)}
                className="bg-white hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ArrowDownCircle className="mr-2 h-5 w-5 text-red-500" />
                Registrar Egreso
              </Button>
            </div>
          )}

          {isOpen ? (
            <Card className="border shadow-xs overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  Desglose por Método de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/10 border-b text-muted-foreground">
                        <th className="text-left py-4 px-6 font-medium">Método</th>
                        <th className="text-right py-4 px-6 font-medium">Apertura</th>
                        <th className="text-right py-4 px-6 font-medium">Ingresos</th>
                        <th className="text-right py-4 px-6 font-medium">Egresos</th>
                        <th className="text-right py-4 px-6 font-medium">Esperado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {Object.entries(cashStatus?.summary || {}).map(([method, summary]) => (
                        summary.expected > 0 || summary.opening > 0 ? (
                          <tr key={method} className="hover:bg-muted/20 transition-colors">
                            <td className="py-4 px-6 font-semibold text-card-foreground">{getMethodName(method)}</td>
                            <td className="text-right py-4 px-6">{formatCurrency(summary.opening)}</td>
                            <td className="text-right py-4 px-6 text-emerald-600 font-medium">+{formatCurrency(summary.income)}</td>
                            <td className="text-right py-4 px-6 text-red-600 font-medium">-{formatCurrency(summary.expense)}</td>
                            <td className="text-right py-4 px-6 font-bold text-base text-primary">
                              {formatCurrency(summary.expected)}
                            </td>
                          </tr>
                        ) : null
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed border-muted">
               <XCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
               <h3 className="text-xl font-semibold text-card-foreground">Caja Cerrada</h3>
               <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                 No hay una jornada activa. Abre la caja para comenzar a registrar movimientos.
               </p>
               <Button onClick={() => setIsOpenModalOpen(true)} className="mt-6 bg-emerald-600 hover:bg-emerald-700">
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Abrir Caja Ahora
               </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-6 animate-in fade-in-50 duration-500">
          <Card className="border shadow-xs overflow-hidden">
             <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-muted-foreground" />
                  Historial de Arqueos
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
                   <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                   Cargando historial...
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hay arqueos previos registrados
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/10 border-b text-muted-foreground">
                        <th className="text-left py-4 px-6 font-medium">Fecha</th>
                        <th className="text-left py-4 px-6 font-medium">Responsable</th>
                        <th className="text-left py-4 px-6 font-medium">Cerrado por</th>
                        <th className="text-right py-4 px-6 font-medium">Monto Cierre</th>
                        <th className="text-right py-4 px-6 font-medium">Diferencia</th>
                        <th className="text-center py-4 px-6 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {history.map((record) => (
                        <tr key={record.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-card-foreground">{record.date}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3" />
                              {record.openedAt && `${new Date(record.openedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`}
                              {record.closedAt && ` - ${new Date(record.closedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 text-primary" aria-hidden="true" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold tracking-tight text-card-foreground">
                                  {record.responsibleBy}
                                </span>
                                {record.openedBy !== record.responsibleBy && (
                                  <span className="text-[10px] text-muted-foreground">
                                    Abierto por: {record.openedBy}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-muted-foreground">{record.closedBy || '-'}</td>
                          <td className="text-right py-4 px-6 font-semibold">
                            {record.closingAmount !== null
                              ? formatCurrency(record.closingAmount)
                              : '-'}
                          </td>
                          <td className={`text-right py-4 px-6 font-bold ${
                            record.difference > 0
                              ? 'text-blue-600'
                              : record.difference < 0
                              ? 'text-red-600'
                              : 'text-emerald-600'
                          }`}>
                            {record.difference !== 0
                              ? `${record.difference > 0 ? '+' : ''}${formatCurrency(record.difference)}`
                              : <CheckCircle2 className="h-4 w-4 ml-auto" />}
                          </td>
                          <td className="text-center py-4 px-6">
                            {!record.isClosed ? (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Abierta</Badge>
                            ) : record.difference === 0 ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Cuadrado</Badge>
                            ) : record.difference > 0 ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Sobrante</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Faltante</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {historyPagination && historyPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 bg-muted/10 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        disabled={historyPage === 1}
                        className="h-8"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      <span className="text-xs text-muted-foreground font-medium">
                        Página {historyPage} de {historyPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage((p) => p + 1)}
                        disabled={!historyPagination.hasMore}
                        className="h-8"
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals are updated to use standard UI where possible */}
      {/* Open Cash Modal */}
      <ModalBase
        isOpen={isOpenModalOpen}
        onClose={() => setIsOpenModalOpen(false)}
        title="Abrir Caja"
      >
        <div className="space-y-6 p-1">
          <div className="space-y-2">
            <Label htmlFor="openingAmount">
              Monto Inicial Efectivo
              {cashStatus && cashStatus.suggestedOpeningAmount > 0 && (
                <span className="text-xs text-emerald-600 font-medium ml-2 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Sugerido: {formatCurrency(cashStatus.suggestedOpeningAmount)}
                </span>
              )}
            </Label>
            <div className="relative">
               <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                 id="openingAmount"
                 type="number"
                 min="0"
                 step="0.01"
                 value={openingAmount}
                 onChange={(e) => setOpeningAmount(e.target.value)}
                 className="pl-9"
                 placeholder="0.00"
               />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">Responsable de Caja</Label>
            <Select value={responsibleId} onValueChange={setResponsibleId}>
               <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un responsable" />
               </SelectTrigger>
               <SelectContent>
                  {staffUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} {user.id === currentUserId ? '(Yo)' : ''}
                    </SelectItem>
                  ))}
               </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground leading-tight italic">
              El responsable es quien opera físicamente la caja durante el turno. Por defecto es el usuario actual.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsOpenModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleOpenCash} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              Abrir Caja
            </Button>
          </div>
        </div>
      </ModalBase>

      {/* Expense Modal */}
      <ModalBase
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Registrar Egreso"
      >
        <div className="space-y-4 p-1">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="expenseAmount">Monto</Label>
               <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="expenseAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="pl-9"
                    placeholder="0.00"
                  />
               </div>
             </div>
             <div className="space-y-2">
               <Label htmlFor="expenseMethod">Método de Pago</Label>
               <Select value={expenseMethod} onValueChange={setExpenseMethod}>
                  <SelectTrigger className="w-full">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     {paymentMethods.map((method) => (
                        <SelectItem key={method.code} value={method.code}>
                          {method.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
               </Select>
             </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expenseReason">Motivo *</Label>
            <Input
              id="expenseReason"
              value={expenseReason}
              onChange={(e) => setExpenseReason(e.target.value)}
              placeholder="Ej: Pago proveedor, servicios, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expenseNotes">Notas (opcional)</Label>
            <textarea
              id="expenseNotes"
              value={expenseNotes}
              onChange={(e) => setExpenseNotes(e.target.value)}
              placeholder="Detalles adicionales"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsExpenseModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterExpense} variant="destructive">
              Registrar Egreso
            </Button>
          </div>
        </div>
      </ModalBase>

      {/* Income Modal */}
      <ModalBase
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        title="Registrar Ingreso"
      >
        <div className="space-y-4 p-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="incomeAmount">Monto</Label>
              <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="incomeAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                    className="pl-9"
                    placeholder="0.00"
                  />
               </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="incomeMethod">Método de Pago</Label>
              <Select value={incomeMethod} onValueChange={setIncomeMethod}>
                  <SelectTrigger className="w-full">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.code} value={method.code}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="incomeReason">Motivo *</Label>
            <Input
              id="incomeReason"
              value={incomeReason}
              onChange={(e) => setIncomeReason(e.target.value)}
              placeholder="Ej: Inyección de capital, reembolso, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="incomeNotes">Notas (opcional)</Label>
            <textarea
              id="incomeNotes"
              value={incomeNotes}
              onChange={(e) => setIncomeNotes(e.target.value)}
              placeholder="Detalles adicionales"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsIncomeModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterIncome} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              Registrar Ingreso
            </Button>
          </div>
        </div>
      </ModalBase>

      {/* Close Cash Modal */}
      <ModalBase
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="Cierre y Arqueo de Caja"
        maxWidth="4xl"
      >
        <div className="space-y-6 p-1">
          <div className="rounded-xl border shadow-xs overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left py-3 px-6 font-medium">Método</th>
                  <th className="text-right py-3 px-6 font-medium">Esperado</th>
                  <th className="text-right py-3 px-6 font-medium">Contado</th>
                  <th className="text-right py-3 px-6 font-medium">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.entries(cashStatus?.summary || {}).map(([method, summary]) => {
                  const diff = calculateDifference(method);
                  const hasDiff = Math.abs(diff) > 0.01;
                  
                  return (
                    <tr key={method} className="hover:bg-muted/5 transition-colors">
                      <td className="py-3 px-6 font-semibold text-card-foreground">{getMethodName(method)}</td>
                      <td className="text-right py-3 px-6 font-medium text-muted-foreground">
                        {formatCurrency(summary.expected)}
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="relative inline-block w-40">
                           <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                           <Input
                             type="number"
                             min="0"
                             step="0.01"
                             value={counts[method] || ''}
                             onChange={(e) => setCounts(prev => ({ ...prev, [method]: e.target.value }))}
                             className="pl-8 text-right h-9"
                             placeholder="0.00"
                           />
                        </div>
                      </td>
                      <td className={`text-right py-3 px-6 font-bold ${
                        hasDiff 
                          ? diff > 0 
                            ? 'text-blue-600'
                            : 'text-red-600'
                          : 'text-emerald-600'
                      }`}>
                        {hasDiff ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                            {diff > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Cuadrado</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Check for differences */}
          {Object.entries(cashStatus?.summary || {}).some(([method]) => 
            Math.abs(calculateDifference(method)) > 0.01
          ) && (
            <div className="space-y-3 p-4 bg-red-50 border border-red-100 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-bold">Diferencias detectadas</span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="differenceReason" className="text-red-800">
                  Explicación de las diferencias *
                </Label>
                <textarea
                  id="differenceReason"
                  value={differenceReason}
                  onChange={(e) => setDifferenceReason(e.target.value)}
                  placeholder="Explique las diferencias encontradas (mínimo 5 caracteres)"
                  className="flex min-h-[100px] w-full rounded-md border-red-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20 focus-visible:border-red-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsCloseModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCloseCash} variant="destructive" className="font-semibold shadow-lg">
              Confirmar Cierre de Caja
            </Button>
          </div>
        </div>
      </ModalBase>
    </div>
  );
}
