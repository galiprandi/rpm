"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModalBase } from "@/components/ui/ModalBase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUI } from "@/components/ui/UIProvider";
import { Header, CrudStats } from "@/components/adm";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatARS } from "@/lib/utils/format";
import { ARGENTINA_TIMEZONE } from "@/lib/utils/date";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  FileText,
  StickyNote,
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
  Package,
  Receipt,
  RotateCcw,
  AlertTriangle,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";

interface CashSummary {
  opening: number;
  income: number;
  expense: number;
  expected: number;
}

interface CashStatus {
  status: "OPEN" | "CLOSED";
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
  status: "BALANCED" | "SURPLUS" | "SHORTAGE" | "OPEN";
  isClosed: boolean;
}

interface PaymentMethod {
  code: string;
  name: string;
}

interface CeremonySummary {
  totalSales: number;
  transactionCount: number;
  topProduct: { name: string; quantity: number } | null;
  peakHour: { label: string; count: number } | null;
  totalExpected: number;
  totalCounted: number;
  totalDifference: number;
  hasDifference: boolean;
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
  const [openingAmount, setOpeningAmount] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseMethod, setExpenseMethod] = useState("CASH");
  const [expenseReason, setExpenseReason] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeMethod, setIncomeMethod] = useState("CASH");
  const [incomeReason, setIncomeReason] = useState("");
  const [incomeNotes, setIncomeNotes] = useState("");
  const [differenceReason, setDifferenceReason] = useState("");
  const [serverDifferences, setServerDifferences] = useState<Record<
    string,
    number
  > | null>(null);
  const [counts, setCounts] = useState<Record<string, string>>({});

  // Close flow state: confirmation dialog + ceremony summary
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isCeremonyOpen, setIsCeremonyOpen] = useState(false);
  const [ceremonyData, setCeremonyData] = useState<CeremonySummary | null>(null);
  const [reopenLoading, setReopenLoading] = useState(false);
  const differenceReasonRef = useRef<HTMLTextAreaElement>(null);
  // Refs to allow retry actions to reference the latest handler without TDZ
  const fetchStatusRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const reopenRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Responsible user state
  const [responsibleId, setResponsibleId] = useState("");
  const [staffUsers, setStaffUsers] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [currentUserId, setCurrentUserId] = useState("");

  // Tabs and history state
  const [activeTab, setActiveTab] = useState("status");
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
      const res = await fetch("/api/cash/status");
      if (res.ok) {
        const data = await res.json();
        setCashStatus(data);
        // Initialize counts from current values
        const initialCounts: Record<string, string> = {};
        Object.keys(data.summary || {}).forEach((method) => {
          initialCounts[method] = String(data.summary[method]?.expected || 0);
        });
        setCounts(initialCounts);
      } else {
        await alert({
          title: "No se pudo cargar el estado de caja",
          description:
            "Ocurrió un error al consultar el estado actual. Verifique su conexión e intente nuevamente.",
          variant: "error",
          action: { label: "Reintentar", onClick: () => fetchStatusRef.current() },
        });
      }
    } catch (error) {
      console.error("Error fetching cash status:", error);
      await alert({
        title: "Sin conexión con el servidor",
        description:
          "No se pudo contactar al servidor para obtener el estado de caja. Reintente en unos segundos.",
        variant: "error",
        action: { label: "Reintentar", onClick: () => fetchStatusRef.current() },
      });
    }
  }, [alert]);

  // Keep retry ref in sync with the latest status handler
  useEffect(() => {
    fetchStatusRef.current = fetchStatus;
  }, [fetchStatus]);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const res = await fetch("/api/payment-methods");
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  }, []);

  const fetchStaffUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users?role=staff,admin&active=true");
      if (res.ok) {
        const data = await res.json();
        setStaffUsers(data.users || []);
        // Store current user ID from session
        const sessionRes = await fetch("/api/auth/session");
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
      console.error("Error fetching staff users:", error);
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
      console.error("Error fetching history:", error);
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
    if (activeTab === "history") {
      fetchHistory(historyPage);
    }
  }, [activeTab, historyPage, fetchHistory]);

  const handleOpenCash = async () => {
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) {
      await alert({
        title: "Error",
        description: "Ingrese un monto válido",
        variant: "error",
      });
      return;
    }

    try {
      const res = await fetch("/api/cash/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, responsibleId }),
      });

      if (res.ok) {
        setIsOpenModalOpen(false);
        setOpeningAmount("");
        setResponsibleId(currentUserId); // Reset to current user
        fetchStatus();
      } else {
        const error = await res.json();
        await alert({
          title: "Error",
          description: error.error || "No se pudo abrir la caja",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error opening cash:", error);
      await alert({
        title: "Error",
        description: "Error al abrir la caja",
        variant: "error",
      });
    }
  };

  const handleRegisterExpense = async () => {
    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      await alert({
        title: "Error",
        description: "Ingrese un monto válido mayor a 0",
        variant: "error",
      });
      return;
    }

    if (!expenseReason.trim()) {
      await alert({
        title: "Error",
        description: "Ingrese un motivo para el egreso",
        variant: "error",
      });
      return;
    }

    try {
      const res = await fetch("/api/cash/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          method: expenseMethod,
          reason: expenseReason,
          notes: expenseNotes,
        }),
      });

      if (res.ok) {
        await alert({
          title: "Éxito",
          description: "Egreso registrado correctamente",
          variant: "success",
        });
        setIsExpenseModalOpen(false);
        setExpenseAmount("");
        setExpenseReason("");
        setExpenseNotes("");
        fetchStatus();
      } else {
        const error = await res.json();
        await alert({
          title: "Error",
          description: error.error || "No se pudo registrar el egreso",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error registering expense:", error);
      await alert({
        title: "Error",
        description: "Error al registrar el egreso",
        variant: "error",
      });
    }
  };

  const handleRegisterIncome = async () => {
    const amount = parseFloat(incomeAmount);
    if (isNaN(amount) || amount <= 0) {
      await alert({
        title: "Error",
        description: "Ingrese un monto válido mayor a 0",
        variant: "error",
      });
      return;
    }

    if (!incomeReason.trim()) {
      await alert({
        title: "Error",
        description: "Ingrese un motivo para el ingreso",
        variant: "error",
      });
      return;
    }

    try {
      const res = await fetch("/api/cash/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          method: incomeMethod,
          reason: incomeReason,
          notes: incomeNotes,
        }),
      });

      if (res.ok) {
        await alert({
          title: "Éxito",
          description: "Ingreso registrado correctamente",
          variant: "success",
        });
        setIsIncomeModalOpen(false);
        setIncomeAmount("");
        setIncomeReason("");
        setIncomeNotes("");
        fetchStatus();
      } else {
        const error = await res.json();
        await alert({
          title: "Error",
          description: error.error || "No se pudo registrar el ingreso",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error registering income:", error);
      await alert({
        title: "Error",
        description: "Error al registrar el ingreso",
        variant: "error",
      });
    }
  };

  // Build the counts payload from the current input state
  const buildCountsData = useCallback((): Record<string, number> => {
    const countsData: Record<string, number> = {};
    Object.entries(counts).forEach(([method, value]) => {
      countsData[method] = parseFloat(value) || 0;
    });
    return countsData;
  }, [counts]);

  // Open the confirmation dialog after validating counts + reason
  const handleConfirmClose = async () => {
    if (isClosing) return;
    const countsData = buildCountsData();

    // Check for differences (including server-reported ones from cache staleness)
    let hasDifference = false;
    Object.entries(cashStatus?.summary || {}).forEach(([method, summary]) => {
      const expected = summary.expected;
      const counted = countsData[method] || 0;
      if (Math.abs(expected - counted) > 0.01) {
        hasDifference = true;
      }
    });
    if (serverDifferences) {
      hasDifference = true;
    }

    if (
      hasDifference &&
      (!differenceReason || differenceReason.trim().length < 5)
    ) {
      await alert({
        title: "Diferencias detectadas",
        description:
          "Debe ingresar una explicación de al menos 5 caracteres para las diferencias encontradas antes de confirmar el cierre.",
        variant: "error",
      });
      return;
    }

    setIsCloseConfirmOpen(true);
  };

  // Fetch the day's sales report to populate the ceremony summary
  const fetchCeremonyData = useCallback(
    async (closeResponse: {
      expected: Record<string, number>;
      counted: Record<string, number>;
      differences: Record<string, number>;
      hasDifference: boolean;
    }): Promise<CeremonySummary> => {
      const totalExpected = Object.values(closeResponse.expected).reduce(
        (a, b) => a + (Number(b) || 0),
        0,
      );
      const totalCounted = Object.values(closeResponse.counted).reduce(
        (a, b) => a + (Number(b) || 0),
        0,
      );
      const totalDifference = totalCounted - totalExpected;

      const base: CeremonySummary = {
        totalSales: totalCounted,
        transactionCount: 0,
        topProduct: null,
        peakHour: null,
        totalExpected,
        totalCounted,
        totalDifference,
        hasDifference: closeResponse.hasDifference,
      };

      try {
        const todayStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: ARGENTINA_TIMEZONE,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());

        const res = await fetch(
          `/api/reports/sales?startDate=${todayStr}&endDate=${todayStr}&groupBy=hour`,
        );
        if (res.ok) {
          const data = await res.json();
          base.totalSales = data.totalSales?.current ?? base.totalCounted;
          base.transactionCount = data.orderCount?.current ?? 0;
          if (Array.isArray(data.topProducts) && data.topProducts.length > 0) {
            const top = data.topProducts[0];
            base.topProduct = {
              name: top.name,
              quantity: Number(top.quantity) || 0,
            };
          }
          if (Array.isArray(data.evolution) && data.evolution.length > 0) {
            const peak = data.evolution.reduce(
              (
                max: { label: string; count: number },
                item: { label: string; count: number },
              ) => (item.count > max.count ? item : max),
              data.evolution[0],
            );
            if (peak && peak.count > 0) {
              base.peakHour = { label: peak.label, count: peak.count };
            }
          }
        }
      } catch (error) {
        console.error("Error fetching ceremony sales data:", error);
      }

      return base;
    },
    [],
  );

  // Actual close API call — triggered from the confirmation dialog
  const handleCloseCash = async () => {
    if (isClosing) return;
    setIsClosing(true);
    const countsData = buildCountsData();

    let hasDifference = false;
    Object.entries(cashStatus?.summary || {}).forEach(([method, summary]) => {
      const expected = summary.expected;
      const counted = countsData[method] || 0;
      if (Math.abs(expected - counted) > 0.01) {
        hasDifference = true;
      }
    });
    if (serverDifferences) {
      hasDifference = true;
    }

    try {
      const res = await fetch("/api/cash/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counts: countsData,
          differenceReason: hasDifference ? differenceReason : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.requiresReason) {
          // Backend detected differences that the frontend didn't show (cache staleness)
          setIsCloseConfirmOpen(false);
          setServerDifferences(data.differences);
          await alert({
            title: "Diferencias detectadas por el sistema",
            description:
              "El sistema detectó diferencias entre el conteo y los movimientos reales (posible desactualización de caché). Ingrese una explicación y vuelva a confirmar.",
            variant: "warning",
          });
          return;
        }
        setIsCloseConfirmOpen(false);
        setIsCloseModalOpen(false);
        setDifferenceReason("");
        setServerDifferences(null);
        fetchStatus();

        // Discoverable undo: toast with a reopen action so users who
        // accidentally closed can revert immediately, alongside the
        // ceremony modal which also offers the same action.
        toast.success("Caja cerrada correctamente", {
          action: {
            label: "Reabrir",
            onClick: () => handleReopenCash(),
          },
          duration: 10000,
        });

        // Build and show the ceremony summary
        const ceremony = await fetchCeremonyData(data);
        setCeremonyData(ceremony);
        setIsCeremonyOpen(true);
      } else {
        const error = await res.json().catch(() => ({}));
        setIsCloseConfirmOpen(false);
        await alert({
          title: "No se pudo cerrar la caja",
          description:
            error.error ||
            "Ocurrió un error al registrar el cierre. Reintente en unos segundos.",
          variant: "error",
          action: { label: "Reintentar", onClick: () => setIsCloseConfirmOpen(true) },
        });
      }
    } catch (error) {
      console.error("Error closing cash:", error);
      setIsCloseConfirmOpen(false);
      await alert({
        title: "Sin conexión con el servidor",
        description:
          "No se pudo contactar al servidor para cerrar la caja. Verifique su conexión e reintente.",
        variant: "error",
        action: { label: "Reintentar", onClick: () => setIsCloseConfirmOpen(true) },
      });
    } finally {
      setIsClosing(false);
    }
  };

  // Soft-undo: reopen the cash register after a close, using the last closing
  // amount as the new opening. This re-opens for continued operation.
  const handleReopenCash = useCallback(async () => {
    if (reopenLoading) return;
    setReopenLoading(true);
    const amount = cashStatus?.suggestedOpeningAmount || 0;

    try {
      const res = await fetch("/api/cash/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, responsibleId: currentUserId }),
      });

      if (res.ok) {
        await alert({
          title: "Caja reabierta",
          description: `Se reabrió la caja con un monto inicial de ${formatARS(amount)}. Puede continuar registrando movimientos.`,
          variant: "success",
        });
        fetchStatus();
      } else {
        const error = await res.json().catch(() => ({}));
        await alert({
          title: "No se pudo reabrir la caja",
          description:
            error.error ||
            "Ocurrió un error al reabrir la caja. Reintente en unos segundos.",
          variant: "error",
          action: { label: "Reintentar", onClick: () => reopenRef.current() },
        });
      }
    } catch (error) {
      console.error("Error reopening cash:", error);
      await alert({
        title: "Sin conexión con el servidor",
        description:
          "No se pudo contactar al servidor para reabrir la caja. Verifique su conexión e reintente.",
        variant: "error",
        action: { label: "Reintentar", onClick: () => reopenRef.current() },
      });
    } finally {
      setReopenLoading(false);
    }
  }, [reopenLoading, cashStatus?.suggestedOpeningAmount, currentUserId, alert, fetchStatus]);

  // Keep retry ref in sync with the latest reopen handler
  useEffect(() => {
    reopenRef.current = handleReopenCash;
  }, [handleReopenCash]);

  const getMethodName = (code: string) => {
    const method = paymentMethods.find((m) => m.code === code);
    return method?.name || code;
  };

  const calculateDifference = (method: string) => {
    const expected = cashStatus?.summary[method]?.expected || 0;
    const counted = parseFloat(counts[method] || "0") || 0;
    return counted - expected;
  };

  const isOpen = cashStatus?.status === "OPEN";

  // Aggregated totals for the close comparison table + confirmation dialog
  const summaryMethods = Object.keys(cashStatus?.summary || {}).filter(
    (method) => {
      const s = cashStatus?.summary[method];
      return s && (s.expected > 0 || s.opening > 0);
    },
  );

  const closeTotals = useMemo(() => {
    let totalExpected = 0;
    let totalCounted = 0;
    summaryMethods.forEach((method) => {
      totalExpected += cashStatus?.summary[method]?.expected || 0;
      totalCounted += parseFloat(counts[method] || "0") || 0;
    });
    return {
      totalExpected,
      totalCounted,
      totalDifference: totalCounted - totalExpected,
    };
  }, [cashStatus, counts, summaryMethods]);

  // True when every active method has a non-empty count value
  const allCountsEntered = useMemo(() => {
    if (summaryMethods.length === 0) return false;
    return summaryMethods.every(
      (method) =>
        counts[method] !== undefined &&
        counts[method] !== "" &&
        !isNaN(parseFloat(counts[method])),
    );
  }, [counts, summaryMethods]);

  const hasFrontendDifferences = useMemo(
    () => Math.abs(closeTotals.totalDifference) > 0.01,
    [closeTotals.totalDifference],
  );

  // The ceremony modal opens immediately after a successful close and is
  // dismissed by the user, so while it's open the close is always recent.
  // The history tab's reopen button remains available for later reopens.
  const canReopenFromCeremony = isCeremonyOpen && !!cashStatus?.closedAt;

  // Auto-focus the difference-reason field when differences are detected
  useEffect(() => {
    if (
      isCloseModalOpen &&
      (hasFrontendDifferences || serverDifferences) &&
      differenceReasonRef.current
    ) {
      differenceReasonRef.current.focus();
    }
  }, [isCloseModalOpen, hasFrontendDifferences, serverDifferences]);

  const stats = useMemo(
    () => [
      {
        label: "Apertura Efectivo",
        value: formatARS(cashStatus?.summary?.CASH?.opening || 0),
        icon: ArrowUpCircle,
        iconColor: "#10b981", // emerald-500
      },
      {
        label: "Ingresos",
        value: formatARS(cashStatus?.summary?.CASH?.income || 0),
        icon: TrendingUp,
        iconColor: "#3b82f6", // blue-500
      },
      {
        label: "Egresos",
        value: formatARS(cashStatus?.summary?.CASH?.expense || 0),
        icon: TrendingDown,
        iconColor: "#ef4444", // red-500
      },
      {
        label: "Esperado Efectivo",
        value: formatARS(cashStatus?.summary?.CASH?.expected || 0),
        icon: Wallet,
        iconColor: "#9333ea", // purple-600
      },
    ],
    [cashStatus],
  );

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
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-muted animate-pulse rounded-lg"
            ></div>
          ))}
        </div>
        <div className="h-[400px] bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title="Arqueo de Caja"
        description={
          isOpen && cashStatus?.openedAt
            ? `Abierta desde: ${new Date(cashStatus.openedAt).toLocaleString("es-AR")}`
            : cashStatus?.closedAt
              ? `Cerrada el: ${new Date(cashStatus.closedAt).toLocaleString("es-AR")}`
              : "Gestión de apertura, cierre y movimientos de caja"
        }
        leftActions={
          <div key="status-badge" className="flex items-center gap-2 mr-4">
            <Badge
              variant="outline"
              className={cn(
                "px-3 py-1 text-sm font-medium",
                isOpen
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-700 border-slate-200",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full mr-2",
                  isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400",
                )}
              ></span>
              {isOpen ? "Caja Abierta" : "Caja Cerrada"}
            </Badge>
          </div>
        }
        primaryAction={
          !isOpen
            ? {
                label: "Abrir Caja",
                onClick: () => setIsOpenModalOpen(true),
                icon: ArrowUpCircle,
                className: "bg-emerald-600 hover:bg-emerald-700 text-white",
                ariaLabel: "Realizar apertura de caja",
              }
            : {
                label: "Cerrar Caja",
                onClick: () => {
                  setServerDifferences(null);
                  setIsCloseModalOpen(true);
                },
                variant: "destructive",
                icon: DollarSign,
                ariaLabel: "Realizar cierre y arqueo de caja",
              }
        }
      />

      <CrudStats stats={stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 p-1 rounded-lg">
          <TabsTrigger
            value="status"
            className="flex items-center gap-2 rounded-md transition-all"
          >
            <LayoutDashboard
              className="h-4 w-4 pointer-events-none"
              aria-hidden="true"
            />
            Estado
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex items-center gap-2 rounded-md transition-all"
          >
            <History
              className="h-4 w-4 pointer-events-none"
              aria-hidden="true"
            />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="status"
          className="space-y-6 mt-6 animate-in fade-in-50 duration-500"
        >
          {isOpen && (
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsIncomeModalOpen(true)}
                className="bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
              >
                <TrendingUp
                  className="mr-2 h-5 w-5 pointer-events-none"
                  aria-hidden="true"
                />
                Registrar Ingreso
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsExpenseModalOpen(true)}
                className="bg-white hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ArrowDownCircle
                  className="mr-2 h-5 w-5 text-red-500 pointer-events-none"
                  aria-hidden="true"
                />
                Registrar Egreso
              </Button>
            </div>
          )}

          {isOpen ? (
            <Card className="border shadow-xs overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet
                    className="h-5 w-5 text-muted-foreground pointer-events-none"
                    aria-hidden="true"
                  />
                  Desglose por Método de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/10 border-b text-muted-foreground">
                        <th className="text-left py-4 px-6 font-medium">
                          Método
                        </th>
                        <th className="text-right py-4 px-6 font-medium">
                          Apertura
                        </th>
                        <th className="text-right py-4 px-6 font-medium">
                          Ingresos
                        </th>
                        <th className="text-right py-4 px-6 font-medium">
                          Egresos
                        </th>
                        <th className="text-right py-4 px-6 font-medium">
                          Esperado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {Object.entries(cashStatus?.summary || {}).map(
                        ([method, summary]) =>
                          summary.expected > 0 || summary.opening > 0 ? (
                            <tr
                              key={method}
                              className="hover:bg-muted/20 transition-colors"
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
                                    <Wallet
                                      className="h-4 w-4 text-primary pointer-events-none"
                                      aria-hidden="true"
                                    />
                                  </div>
                                  <span className="font-semibold tracking-tight text-card-foreground">
                                    {getMethodName(method)}
                                  </span>
                                </div>
                              </td>
                              <td className="text-right py-4 px-6 font-mono text-sm">
                                {formatARS(summary.opening)}
                              </td>
                              <td className="text-right py-4 px-6 text-emerald-700 font-mono text-sm">
                                +{formatARS(summary.income)}
                              </td>
                              <td className="text-right py-4 px-6 text-red-700 font-mono text-sm">
                                -{formatARS(summary.expense)}
                              </td>
                              <td className="text-right py-4 px-6 font-bold text-base text-primary font-mono">
                                {formatARS(summary.expected)}
                              </td>
                            </tr>
                          ) : null,
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed border-muted">
              <XCircle
                className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20 pointer-events-none"
                aria-hidden="true"
              />
              <h3 className="text-xl font-semibold text-card-foreground">
                Caja Cerrada
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                No hay una jornada activa. Abre la caja para comenzar a
                registrar movimientos.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => setIsOpenModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <ArrowUpCircle
                    className="mr-2 h-4 w-4 pointer-events-none"
                    aria-hidden="true"
                  />
                  Abrir Caja Ahora
                </Button>
                {cashStatus?.closedAt && (
                  <Button
                    onClick={handleReopenCash}
                    disabled={reopenLoading}
                    variant="outline"
                    className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    <RotateCcw
                      className="mr-2 h-4 w-4 pointer-events-none"
                      aria-hidden="true"
                    />
                    {reopenLoading ? "Reabriendo..." : "Reabrir Caja"}
                  </Button>
                )}
              </div>
              {cashStatus?.closedAt && (
                <p className="text-xs text-muted-foreground mt-4 max-w-md mx-auto">
                  Si cerró por error y aún no registró movimientos, puede
                  reabrir la caja con el monto del último cierre.
                </p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="history"
          className="space-y-6 mt-6 animate-in fade-in-50 duration-500"
        >
          <Card className="border shadow-xs overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <History
                  className="h-5 w-5 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
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
                        <th className="text-left py-4 px-6 font-medium">
                          Fecha
                        </th>
                        <th className="text-left py-4 px-6 font-medium">
                          Responsable
                        </th>
                        <th className="text-left py-4 px-6 font-medium">
                          Cerrado por
                        </th>
                        <th className="text-right py-4 px-6 font-medium">
                          Monto Cierre
                        </th>
                        <th className="text-right py-4 px-6 font-medium">
                          Diferencia
                        </th>
                        <th className="text-center py-4 px-6 font-medium">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {history.map((record) => (
                        <tr
                          key={record.id}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="font-semibold text-card-foreground">
                              {record.date}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                              <Clock
                                className="h-3 w-3 pointer-events-none"
                                aria-hidden="true"
                              />
                              {record.openedAt &&
                                `${new Date(record.openedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`}
                              {record.closedAt &&
                                ` - ${new Date(record.closedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
                                <User
                                  className="h-4 w-4 text-primary pointer-events-none"
                                  aria-hidden="true"
                                />
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
                          <td className="py-4 px-6 text-muted-foreground">
                            {record.closedBy || "-"}
                          </td>
                          <td className="text-right py-4 px-6 font-semibold font-mono">
                            {record.closingAmount !== null
                              ? formatARS(record.closingAmount)
                              : "-"}
                          </td>
                          <td
                            className={`text-right py-4 px-6 font-bold font-mono ${
                              record.difference > 0
                                ? "text-blue-700"
                                : record.difference < 0
                                  ? "text-red-700"
                                  : "text-emerald-700"
                            }`}
                          >
                            {record.difference !== 0 ? (
                              `${record.difference > 0 ? "+" : ""}${formatARS(record.difference)}`
                            ) : (
                              <CheckCircle2
                                className="h-4 w-4 ml-auto pointer-events-none"
                                aria-hidden="true"
                              />
                            )}
                          </td>
                          <td className="text-center py-4 px-6">
                            {!record.isClosed ? (
                              <Badge
                                variant="outline"
                                className="bg-orange-50 text-orange-700 border-orange-200"
                              >
                                Abierta
                              </Badge>
                            ) : record.difference === 0 ? (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200"
                              >
                                Cuadrado
                              </Badge>
                            ) : record.difference > 0 ? (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200"
                              >
                                Sobrante
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-700 border-red-200"
                              >
                                Faltante
                              </Badge>
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
                        onClick={() =>
                          setHistoryPage((p) => Math.max(1, p - 1))
                        }
                        disabled={historyPage === 1}
                        className="h-8"
                      >
                        <ChevronLeft
                          className="h-4 w-4 mr-1 pointer-events-none"
                          aria-hidden="true"
                        />
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
                        <ChevronRight
                          className="h-4 w-4 ml-1 pointer-events-none"
                          aria-hidden="true"
                        />
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
                <span className="text-xs text-emerald-700 font-medium ml-2 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Sugerido: {formatARS(cashStatus.suggestedOpeningAmount)}
                </span>
              )}
            </Label>
            <div className="relative">
              <DollarSign
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="openingAmount"
                type="number"
                min="0"
                step="0.01"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                className="pl-9 font-mono"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">Responsable de Caja</Label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"
                aria-hidden="true"
              />
              <Select value={responsibleId} onValueChange={setResponsibleId}>
                <SelectTrigger className="w-full pl-9">
                  <SelectValue placeholder="Seleccione un responsable" />
                </SelectTrigger>
                <SelectContent>
                  {staffUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} {user.id === currentUserId ? "(Yo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight italic">
              El responsable es quien opera físicamente la caja durante el
              turno. Por defecto es el usuario actual.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsOpenModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleOpenCash}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
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
                <DollarSign
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="expenseAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="pl-9 font-mono"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenseMethod">Método de Pago</Label>
              <div className="relative">
                <Wallet
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"
                  aria-hidden="true"
                />
                <Select value={expenseMethod} onValueChange={setExpenseMethod}>
                  <SelectTrigger className="w-full pl-9">
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="expenseReason">Motivo *</Label>
            <div className="relative">
              <FileText
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="expenseReason"
                value={expenseReason}
                onChange={(e) => setExpenseReason(e.target.value)}
                className="pl-9"
                placeholder="Ej: Pago proveedor, servicios, etc."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expenseNotes">Notas (opcional)</Label>
            <div className="relative">
              <StickyNote
                className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <textarea
                id="expenseNotes"
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                placeholder="Detalles adicionales"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsExpenseModalOpen(false)}
            >
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
                <DollarSign
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="incomeAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="pl-9 font-mono"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="incomeMethod">Método de Pago</Label>
              <div className="relative">
                <Wallet
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"
                  aria-hidden="true"
                />
                <Select value={incomeMethod} onValueChange={setIncomeMethod}>
                  <SelectTrigger className="w-full pl-9">
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="incomeReason">Motivo *</Label>
            <div className="relative">
              <FileText
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="incomeReason"
                value={incomeReason}
                onChange={(e) => setIncomeReason(e.target.value)}
                className="pl-9"
                placeholder="Ej: Inyección de capital, reembolso, etc."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="incomeNotes">Notas (opcional)</Label>
            <div className="relative">
              <StickyNote
                className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <textarea
                id="incomeNotes"
                value={incomeNotes}
                onChange={(e) => setIncomeNotes(e.target.value)}
                placeholder="Detalles adicionales"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsIncomeModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRegisterIncome}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
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
                  <th className="text-right py-3 px-6 font-medium">
                    Diferencia
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.entries(cashStatus?.summary || {}).map(
                  ([method, summary]) => {
                    if (!(summary.expected > 0 || summary.opening > 0))
                      return null;
                    const diff = calculateDifference(method);
                    const hasDiff = Math.abs(diff) > 0.01;

                    return (
                      <tr
                        key={method}
                        className={cn(
                          "transition-colors",
                          hasDiff
                            ? "bg-red-50 hover:bg-red-100/60"
                            : "hover:bg-muted/5",
                        )}
                      >
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
                              <Wallet
                                className="h-4 w-4 text-primary pointer-events-none"
                                aria-hidden="true"
                              />
                            </div>
                            <span className="font-semibold tracking-tight text-card-foreground">
                              {getMethodName(method)}
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-6 font-mono text-sm text-muted-foreground">
                          {formatARS(summary.expected)}
                        </td>
                        <td className="text-right py-3 px-6">
                          <div className="relative inline-block w-40">
                            <DollarSign
                              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
                              aria-hidden="true"
                            />
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={counts[method] || ""}
                              onChange={(e) =>
                                setCounts((prev) => ({
                                  ...prev,
                                  [method]: e.target.value,
                                }))
                              }
                              className="pl-8 text-right h-9 font-mono"
                              placeholder="0.00"
                              aria-label={`Contado ${getMethodName(method)}`}
                            />
                          </div>
                        </td>
                        <td
                          className={cn(
                            "text-right py-3 px-6 font-bold font-mono",
                            hasDiff
                              ? diff > 0
                                ? "text-amber-600"
                                : "text-red-600"
                              : "text-emerald-600",
                          )}
                        >
                          {hasDiff ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {diff > 0 ? "+" : ""}
                              {formatARS(diff)}
                              {diff > 0 ? (
                                <TrendingUp
                                  className="h-4 w-4 pointer-events-none"
                                  aria-hidden="true"
                                />
                              ) : (
                                <TrendingDown
                                  className="h-4 w-4 pointer-events-none"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <CheckCircle2
                                className="h-4 w-4 pointer-events-none"
                                aria-hidden="true"
                              />
                              <span>Cuadrado</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 border-t-2 border-muted-foreground/10 font-semibold">
                  <td className="py-3 px-6 text-card-foreground">Total</td>
                  <td className="text-right py-3 px-6 font-mono text-card-foreground">
                    {formatARS(closeTotals.totalExpected)}
                  </td>
                  <td className="text-right py-3 px-6 font-mono text-card-foreground">
                    {formatARS(closeTotals.totalCounted)}
                  </td>
                  <td
                    className={cn(
                      "text-right py-3 px-6 font-bold font-mono",
                      Math.abs(closeTotals.totalDifference) > 0.01
                        ? closeTotals.totalDifference > 0
                          ? "text-amber-600"
                          : "text-red-600"
                        : "text-emerald-600",
                    )}
                  >
                    {Math.abs(closeTotals.totalDifference) > 0.01
                      ? `${closeTotals.totalDifference > 0 ? "+" : ""}${formatARS(closeTotals.totalDifference)}`
                      : "Cuadrado"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Check for differences (frontend-detected or server-reported) */}
          {(hasFrontendDifferences || serverDifferences) && (
            <div className="space-y-3 p-4 bg-red-50 border border-red-100 rounded-lg animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle
                  className="h-5 w-5 pointer-events-none"
                  aria-hidden="true"
                />
                <span className="font-bold">Diferencias detectadas</span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="differenceReason" className="text-red-800">
                  Explicación de las diferencias *
                </Label>
                <div className="relative">
                  <StickyNote
                    className="absolute left-3 top-3 h-4 w-4 text-red-400 pointer-events-none"
                    aria-hidden="true"
                  />
                  <textarea
                    id="differenceReason"
                    ref={differenceReasonRef}
                    value={differenceReason}
                    onChange={(e) => setDifferenceReason(e.target.value)}
                    placeholder="Explique las diferencias encontradas (mínimo 5 caracteres)"
                    className="flex min-h-[100px] w-full rounded-md border-red-200 bg-white pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20 focus-visible:border-red-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {!allCountsEntered && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertCircle
                className="h-3.5 w-3.5 pointer-events-none"
                aria-hidden="true"
              />
              Ingrese el monto contado de todos los métodos para habilitar el
              cierre.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsCloseModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmClose}
              disabled={!allCountsEntered || isClosing}
              variant="destructive"
              className="font-semibold shadow-lg"
            >
              Confirmar Cierre de Caja
            </Button>
          </div>
        </div>
      </ModalBase>

      {/* Close Confirmation Dialog (AlertDialog pattern) */}
      <ModalBase
        isOpen={isCloseConfirmOpen}
        onClose={() => setIsCloseConfirmOpen(false)}
        title="Confirmar Cierre de Caja"
        maxWidth="md"
      >
        <div className="space-y-5 p-1">
          <div className="flex items-start gap-3.5">
            <div className="flex-shrink-0 rounded-lg p-2.5 bg-red-500/10">
              <AlertTriangle
                className="h-5 w-5 text-red-600 pointer-events-none"
                aria-hidden="true"
              />
            </div>
            <div className="flex-1 space-y-1 pt-0.5">
              <h3 className="text-base font-semibold leading-tight">
                ¿Confirmar el cierre de caja?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Revise el resumen antes de confirmar. Esta acción registra el
                arqueo definitivo del día.
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y">
                <tr>
                  <td className="py-2.5 px-4 text-muted-foreground">
                    Total Esperado
                  </td>
                  <td className="text-right py-2.5 px-4 font-mono font-semibold text-card-foreground">
                    {formatARS(closeTotals.totalExpected)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-muted-foreground">
                    Total Contado
                  </td>
                  <td className="text-right py-2.5 px-4 font-mono font-semibold text-card-foreground">
                    {formatARS(closeTotals.totalCounted)}
                  </td>
                </tr>
                <tr
                  className={cn(
                    Math.abs(closeTotals.totalDifference) > 0.01 &&
                      "bg-red-50",
                  )}
                >
                  <td className="py-2.5 px-4 text-muted-foreground">
                    Diferencia
                  </td>
                  <td
                    className={cn(
                      "text-right py-2.5 px-4 font-mono font-bold",
                      Math.abs(closeTotals.totalDifference) > 0.01
                        ? closeTotals.totalDifference > 0
                          ? "text-amber-600"
                          : "text-red-600"
                        : "text-emerald-600",
                    )}
                  >
                    {Math.abs(closeTotals.totalDifference) > 0.01
                      ? `${closeTotals.totalDifference > 0 ? "+" : ""}${formatARS(closeTotals.totalDifference)}`
                      : "Cuadrado"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {(hasFrontendDifferences || serverDifferences) &&
            differenceReason.trim() && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">
                  Motivo de la diferencia
                </p>
                <p className="text-sm text-red-800">
                  {differenceReason.trim()}
                </p>
              </div>
            )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsCloseConfirmOpen(false)}
              disabled={isClosing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCloseCash}
              disabled={isClosing}
              variant="destructive"
              className="font-semibold"
            >
              {isClosing ? "Cerrando..." : "Sí, Cerrar Caja"}
            </Button>
          </div>
        </div>
      </ModalBase>

      {/* Ceremony Summary — positive emotional peak after the daily ritual */}
      <ModalBase
        isOpen={isCeremonyOpen}
        onClose={() => setIsCeremonyOpen(false)}
        title="Caja Cerrada"
        maxWidth="md"
      >
        <div className="space-y-6 p-1">
          <div className="flex flex-col items-center text-center pt-2">
            <div className="rounded-full bg-emerald-500/10 p-3 mb-3">
              <PartyPopper
                className="h-7 w-7 text-emerald-600 pointer-events-none"
                aria-hidden="true"
              />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground">
              ¡Arqueo completado!
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Resumen de la jornada de hoy
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Total ventas del día */}
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp
                  className="h-4 w-4 text-emerald-600 pointer-events-none"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Ventas del día
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-600">
                {formatARS(ceremonyData?.totalSales ?? 0)}
              </div>
            </div>

            {/* Cantidad de transacciones */}
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt
                  className="h-4 w-4 text-primary pointer-events-none"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Transacciones
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-card-foreground">
                {ceremonyData?.transactionCount ?? 0}
              </div>
            </div>

            {/* Top producto del día */}
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package
                  className="h-4 w-4 text-primary pointer-events-none"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Top del día
                </span>
              </div>
              <div className="text-sm font-semibold text-card-foreground truncate">
                {ceremonyData?.topProduct?.name || "Sin datos"}
              </div>
              {ceremonyData?.topProduct && (
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {ceremonyData.topProduct.quantity} u.
                </div>
              )}
            </div>

            {/* Hora pico */}
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock
                  className="h-4 w-4 text-primary pointer-events-none"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Hora pico
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-card-foreground">
                {ceremonyData?.peakHour?.label || "—"}
              </div>
              {ceremonyData?.peakHour && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {ceremonyData.peakHour.count} ops.
                </div>
              )}
            </div>
          </div>

          {/* Diferencia final */}
          <div
            className={cn(
              "rounded-lg border p-4 flex items-center justify-between",
              ceremonyData && Math.abs(ceremonyData.totalDifference) > 0.01
                ? "border-red-100 bg-red-50"
                : "border-emerald-100 bg-emerald-50",
            )}
          >
            <div className="flex items-center gap-2">
              {ceremonyData &&
              Math.abs(ceremonyData.totalDifference) > 0.01 ? (
                <AlertCircle
                  className="h-5 w-5 text-red-600 pointer-events-none"
                  aria-hidden="true"
                />
              ) : (
                <CheckCircle2
                  className="h-5 w-5 text-emerald-600 pointer-events-none"
                  aria-hidden="true"
                />
              )}
              <span className="font-semibold text-card-foreground">
                Diferencia final
              </span>
            </div>
            <span
              className={cn(
                "text-lg font-bold font-mono",
                ceremonyData &&
                  Math.abs(ceremonyData.totalDifference) > 0.01
                  ? ceremonyData.totalDifference > 0
                    ? "text-amber-600"
                    : "text-red-600"
                  : "text-emerald-600",
              )}
            >
              {ceremonyData &&
              Math.abs(ceremonyData.totalDifference) > 0.01
                ? `${ceremonyData.totalDifference > 0 ? "+" : ""}${formatARS(ceremonyData.totalDifference)}`
                : "Cuadrado"}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {canReopenFromCeremony && (
              <Button
                onClick={() => {
                  setIsCeremonyOpen(false);
                  handleReopenCash();
                }}
                disabled={reopenLoading}
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                aria-label="Reabrir caja tras cierre accidental"
              >
                <RotateCcw
                  className="mr-2 h-4 w-4 pointer-events-none"
                  aria-hidden="true"
                />
                {reopenLoading ? "Reabriendo..." : "Reabrir Caja"}
              </Button>
            )}
            <Button
              onClick={() => setIsCeremonyOpen(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Listo
            </Button>
          </div>
        </div>
      </ModalBase>
    </div>
  );
}
