'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalBase } from '@/components/ui/ModalBase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUI } from '@/components/ui/UIProvider';
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
  List,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
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
  const [history, setHistory] = useState<any[]>([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState<any>(null);

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

  const fetchRecentMovements = useCallback(async () => {
    if (!cashStatus?.openedAt) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // This would need a new endpoint or we can filter from a general endpoint
      // For now, we'll show placeholder logic
      setRecentMovements([]);
    } catch (error) {
      console.error('Error fetching recent movements:', error);
    }
  }, [cashStatus?.openedAt]);

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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const isOpen = cashStatus?.status === 'OPEN';

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Arqueo de Caja</h1>
          <p className="text-muted-foreground">
            Gestión de apertura, cierre y movimientos de caja
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            isOpen
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isOpen ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Caja Abierta</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Caja Cerrada</span>
              </>
            )}
          </div>

          {/* CTA junto al indicador */}
          {!isOpen && (
            <Button
              size="lg"
              onClick={() => setIsOpenModalOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <ArrowUpCircle className="mr-2 h-5 w-5" />
              Abrir Caja
            </Button>
          )}

          {isOpen && cashStatus && (
            <Button
              size="lg"
              onClick={() => setIsCloseModalOpen(true)}
              variant="destructive"
            >
              <DollarSign className="mr-2 h-5 w-5" />
              Cerrar Caja
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 max-w-md">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Estado</span>
            <span className="sm:hidden">Estado</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Historial</span>
            <span className="sm:hidden">Historial</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          {/* Status Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Apertura Efectivo</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(cashStatus?.summary?.CASH?.opening || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(cashStatus?.summary?.CASH?.income || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(cashStatus?.summary?.CASH?.expense || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esperado Efectivo</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(cashStatus?.summary?.CASH?.expected || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons - Solo movimientos (apertura/cierre van en header) */}
      {isOpen && cashStatus && (
        <div className="flex flex-wrap gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={() => setIsIncomeModalOpen(true)}
            className="bg-green-50 border-green-200 hover:bg-green-100"
          >
            <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
            Registrar Ingreso
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => setIsExpenseModalOpen(true)}
          >
            <ArrowDownCircle className="mr-2 h-5 w-5" />
            Registrar Egreso
          </Button>
        </div>
      )}

      {/* Summary by Method */}
      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Desglose por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Método</th>
                    <th className="text-right py-3 px-4 font-medium">Apertura</th>
                    <th className="text-right py-3 px-4 font-medium">Ingresos</th>
                    <th className="text-right py-3 px-4 font-medium">Egresos</th>
                    <th className="text-right py-3 px-4 font-medium">Esperado</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(cashStatus?.summary || {}).map(([method, summary]) => (
                    summary.expected > 0 || summary.opening > 0 ? (
                      <tr key={method} className="border-b">
                        <td className="py-3 px-4 font-medium">{getMethodName(method)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(summary.opening)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(summary.income)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(summary.expense)}</td>
                        <td className="text-right py-3 px-4 font-bold">
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
      )}

      {/* Open Cash Modal */}
      <ModalBase
        isOpen={isOpenModalOpen}
        onClose={() => setIsOpenModalOpen(false)}
        title="Abrir Caja"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openingAmount">
              Monto Inicial Efectivo
              {cashStatus && cashStatus.suggestedOpeningAmount > 0 && (
                <span className="text-sm text-muted-foreground ml-2">
                  (Sugerido: {formatCurrency(cashStatus.suggestedOpeningAmount)})
                </span>
              )}
            </Label>
            <Input
              id="openingAmount"
              type="number"
              min="0"
              step="0.01"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              placeholder="Ingrese el monto inicial"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">
              Responsable de Caja
              {responsibleId !== currentUserId && (
                <span className="text-sm text-amber-600 ml-2">
                  (Diferente al usuario actual)
                </span>
              )}
            </Label>
            <select
              id="responsible"
              value={responsibleId}
              onChange={(e) => setResponsibleId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {staffUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.id === currentUserId ? '(Yo)' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              El responsable es quien opera físicamente la caja durante el turno.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpenModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleOpenCash}>
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expenseAmount">Monto</Label>
            <Input
              id="expenseAmount"
              type="number"
              min="0.01"
              step="0.01"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="Ingrese el monto"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expenseMethod">Método de Pago</Label>
            <select
              id="expenseMethod"
              value={expenseMethod}
              onChange={(e) => setExpenseMethod(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paymentMethods.map((method) => (
                <option key={method.code} value={method.code}>
                  {method.name}
                </option>
              ))}
            </select>
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
            <Input
              id="expenseNotes"
              value={expenseNotes}
              onChange={(e) => setExpenseNotes(e.target.value)}
              placeholder="Detalles adicionales"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsExpenseModalOpen(false)}>
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="incomeAmount">Monto</Label>
            <Input
              id="incomeAmount"
              type="number"
              min="0.01"
              step="0.01"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              placeholder="Ingrese el monto"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="incomeMethod">Método de Pago</Label>
            <select
              id="incomeMethod"
              value={incomeMethod}
              onChange={(e) => setIncomeMethod(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paymentMethods.map((method) => (
                <option key={method.code} value={method.code}>
                  {method.name}
                </option>
              ))}
            </select>
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
            <Input
              id="incomeNotes"
              value={incomeNotes}
              onChange={(e) => setIncomeNotes(e.target.value)}
              placeholder="Detalles adicionales"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsIncomeModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterIncome} className="bg-green-600 hover:bg-green-700">
              Registrar Ingreso
            </Button>
          </div>
        </div>
      </ModalBase>

      {/* Close Cash Modal */}
      <ModalBase
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="Cerrar Caja - Arqueo"
        maxWidth="4xl"
      >
        <div className="space-y-6">
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Método</th>
                  <th className="text-right py-3 px-4 font-medium">Esperado</th>
                  <th className="text-right py-3 px-4 font-medium">Contado</th>
                  <th className="text-right py-3 px-4 font-medium">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(cashStatus?.summary || {}).map(([method, summary]) => {
                  const diff = calculateDifference(method);
                  const hasDiff = Math.abs(diff) > 0.01;
                  
                  return (
                    <tr key={method} className="border-t">
                      <td className="py-3 px-4 font-medium">{getMethodName(method)}</td>
                      <td className="text-right py-3 px-4">
                        {formatCurrency(summary.expected)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={counts[method] || ''}
                          onChange={(e) => setCounts(prev => ({ ...prev, [method]: e.target.value }))}
                          className="w-32 text-right inline-block"
                        />
                      </td>
                      <td className={`text-right py-3 px-4 font-medium ${
                        hasDiff 
                          ? diff > 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                          : ''
                      }`}>
                        {hasDiff ? (
                          <>
                            {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                            {diff > 0 ? (
                              <TrendingUp className="inline ml-1 h-4 w-4" />
                            ) : (
                              <TrendingDown className="inline ml-1 h-4 w-4" />
                            )}
                          </>
                        ) : (
                          <CheckCircle2 className="inline h-4 w-4 text-green-600" />
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
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Se detectaron diferencias</span>
              </div>
              <Label htmlFor="differenceReason">
                Explicación de las diferencias *
              </Label>
              <textarea
                id="differenceReason"
                value={differenceReason}
                onChange={(e) => setDifferenceReason(e.target.value)}
                placeholder="Explique las diferencias encontradas (mínimo 5 caracteres)"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCloseModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCloseCash} variant="destructive">
              Cerrar Caja
            </Button>
          </div>
        </div>
      </ModalBase>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Arqueos</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8">Cargando historial...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay arqueos previos registrados
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium">Responsable</th>
                        <th className="text-left py-3 px-4 font-medium">Cerrado por</th>
                        <th className="text-right py-3 px-4 font-medium">Monto Cierre</th>
                        <th className="text-right py-3 px-4 font-medium">Diferencia</th>
                        <th className="text-center py-3 px-4 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((record) => (
                        <tr key={record.id} className="border-t">
                          <td className="py-3 px-4">{record.date}</td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{record.responsibleBy}</div>
                            {record.openedBy !== record.responsibleBy && (
                              <div className="text-xs text-muted-foreground">
                                Abierto por: {record.openedBy}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">{record.closedBy || '-'}</td>
                          <td className="text-right py-3 px-4">
                            {record.closingAmount !== null
                              ? formatCurrency(record.closingAmount)
                              : '-'}
                          </td>
                          <td className={`text-right py-3 px-4 font-medium ${
                            record.difference > 0
                              ? 'text-green-600'
                              : record.difference < 0
                              ? 'text-red-600'
                              : ''
                          }`}>
                            {record.difference !== 0
                              ? `${record.difference > 0 ? '+' : ''}${formatCurrency(Math.abs(record.difference))}`
                              : '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            {!record.isClosed ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Abierta
                              </span>
                            ) : record.difference === 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Cuadrado
                              </span>
                            ) : record.difference > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Sobrante
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Faltante
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {historyPagination && historyPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        disabled={historyPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {historyPage} de {historyPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage((p) => p + 1)}
                        disabled={!historyPagination.hasMore}
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
    </div>
  );
}
