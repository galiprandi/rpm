"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Header, CrudAdmin, CrudStats, type StatItem } from "@/components/adm";
import {
  Phone,
  User,
  Eye,
  TrendingDown,
  Users,
  Wallet,
  Plus,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { type CustomerFormData } from "@/components/customers/CustomerForm";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getWhatsAppLink, getDebtReminderMessage } from "@/lib/utils/whatsapp";
import { formatPhone } from "@/lib/utils/format";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  phoneAlt?: string | null;
  email?: string | null;
  balance: number;
  billingData?: unknown;
  vehicles: Array<{
    id: string;
    identifier: string;
    category: string;
  }>;
  _count: {
    workOrders: number;
  };
}

interface CustomersClientProps {
  initialCustomers: Customer[];
}

function isBillingData(
  data: unknown,
): data is { cuit: string; invoiceType: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    "cuit" in data &&
    "invoiceType" in data &&
    typeof (data as { cuit: unknown }).cuit === "string" &&
    typeof (data as { invoiceType: unknown }).invoiceType === "string"
  );
}

export default function CustomersClient({
  initialCustomers,
}: CustomersClientProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showOnlyWithBalance, setShowOnlyWithBalance] = useState(false);

  // Filter customers based on balance
  const filteredCustomers = useMemo(() => {
    if (!showOnlyWithBalance) return customers;
    return customers.filter((c) => c.balance !== 0);
  }, [customers, showOnlyWithBalance]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");

      const response = await fetch(`/api/customers?${params}`);
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setCustomers(data.customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
              <User
                className="h-4 w-4 text-primary pointer-events-none"
                aria-hidden="true"
              />
            </div>
            <div>
              <div className="font-semibold tracking-tight">
                {row.original.name}
              </div>
              {row.original.email && (
                <div className="text-sm text-muted-foreground font-mono">
                  {row.original.email}
                </div>
              )}
              {isBillingData(row.original.billingData) && (
                <div className="text-xs text-blue-700">
                  Fact:{" "}
                  {
                    (
                      row.original.billingData as {
                        cuit: string;
                        invoiceType: string;
                      }
                    ).invoiceType
                  }{" "}
                  - CUIT:{" "}
                  <span className="font-mono">
                    {
                      (
                        row.original.billingData as {
                          cuit: string;
                          invoiceType: string;
                        }
                      ).cuit
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Teléfono",
        cell: ({ row }) => {
          const phone = row.original.phone;
          if (!phone)
            return <span className="text-muted-foreground font-mono">-</span>;

          return (
            <div className="flex items-center gap-2 font-mono group">
              <div className="flex items-center gap-1.5">
                <Phone
                  className="h-3.5 w-3.5 text-muted-foreground/70 pointer-events-none"
                  aria-hidden="true"
                />
                {formatPhone(phone)}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={getWhatsAppLink(
                      phone,
                      row.original.balance > 0
                        ? getDebtReminderMessage(
                            row.original.name,
                            row.original.balance,
                          )
                        : `Hola ${row.original.name}!`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-md hover:bg-emerald-50 text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  {row.original.balance > 0
                    ? "Notificar deuda"
                    : "Enviar WhatsApp"}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        },
      },
      {
        accessorKey: "vehicles",
        header: "Vehículos",
        cell: ({ row }) => {
          const vehicles = row.original.vehicles || [];
          if (!vehicles || vehicles.length === 0) {
            return (
              <span className="text-sm text-muted-foreground">
                Sin vehículos
              </span>
            );
          }
          return (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {vehicles.slice(0, 3).map((v) => (
                <Link
                  key={v.id}
                  href={`/adm/vehicles/${v.id}`}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-secondary/50 text-[10px] font-mono border border-secondary hover:bg-secondary transition-colors"
                >
                  {v.identifier}
                </Link>
              ))}
              {vehicles.length > 3 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{vehicles.length - 3}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "balance",
        header: "Saldo",
        filterFn: (row, id, value) => {
          if (!value) return true;
          const search = value.toLowerCase();
          const customer = row.original;
          return (
            customer.name.toLowerCase().includes(search) ||
            customer.phone?.toLowerCase().includes(search) ||
            customer.email?.toLowerCase().includes(search) ||
            customer.vehicles?.some((v) =>
              v.identifier.toLowerCase().includes(search),
            ) ||
            (isBillingData(customer.billingData) &&
              customer.billingData.cuit.includes(search))
          );
        },
        cell: ({ row }) => {
          const balance = row.original.balance;
          if (balance === 0) {
            return <span className="text-muted-foreground">-</span>;
          }
          if (balance > 0) {
            return (
              <span className="font-mono font-medium text-red-700">
                {new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: "ARS",
                }).format(balance)}
              </span>
            );
          }
          // balance < 0 (saldo a favor)
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-mono font-medium text-emerald-700 cursor-help">
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  }).format(balance)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Saldo a favor del cliente</p>
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        accessorKey: "_count.workOrders",
        header: "OTs",
        cell: ({ row }) => (
          <span className="font-mono font-medium">
            {row.original._count.workOrders}
          </span>
        ),
      },
    ],
    [],
  );

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const stats: StatItem[] = useMemo(
    () => [
      {
        label: "Total Clientes",
        value: customers.length,
        icon: Users,
      },
      {
        label: "Con Saldo",
        value: customers.filter((c) => c.balance !== 0).length,
        icon: Wallet,
        iconColor: customers.some((c) => c.balance > 0) ? "#f97316" : undefined, // orange-500 if someone owes
      },
      {
        label: "Deuda Total",
        value: new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
        }).format(
          customers.reduce(
            (acc, c) => acc + (c.balance > 0 ? c.balance : 0),
            0,
          ),
        ),
        icon: TrendingDown,
        iconColor: "#ef4444", // red-500
      },
    ],
    [customers],
  );

  const handleCreateSubmit = async (formData: CustomerFormData) => {
    setIsCreating(true);
    try {
      const payload = {
        ...formData,
        billingData: formData.billingData?.cuit
          ? formData.billingData
          : undefined,
      };

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to create customer");

      const customer = await response.json();
      setIsCreateModalOpen(false);
      router.push(`/adm/customers/${customer.id}`);
      fetchCustomers();
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Error al crear cliente");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Clientes"
        description="Gestiona las fichas de tus clientes y sus saldos"
        primaryAction={{
          label: "Nuevo Cliente",
          onClick: handleCreate,
          icon: Plus,
          ariaLabel: "Crear nuevo cliente",
          className:
            "bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold px-4 py-2 h-8 whitespace-nowrap",
        }}
        secondaryActions={[
          {
            label: showOnlyWithBalance ? "Ver Todos" : "Filtrar con Saldo",
            onClick: () => setShowOnlyWithBalance(!showOnlyWithBalance),
            variant: "outline",
            icon: TrendingDown,
          },
        ]}
      />

      <div className="mt-4">
        <CrudStats stats={stats} />
      </div>

      <CrudAdmin
        items={filteredCustomers}
        loading={loading}
        onCreate={handleCreate}
        hideCreateAction
        columns={columns}
        emptyIcon={
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        }
        emptyMessage="No hay clientes registrados. Haz clic en 'Nuevo Cliente' para crear el primero."
        createButtonText="Cliente"
        tableTitle="Listado de Clientes"
        searchPlaceholder="Buscar por nombre, CUIT, vehículo o patente..."
        rowActions={(customer) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/adm/customers/${customer.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Ver detalle del cliente"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Ver detalle del cliente</TooltipContent>
          </Tooltip>
        )}
      />

      {/* Modal para crear cliente */}
      <CustomerDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        onCancel={() => setIsCreateModalOpen(false)}
        submitLabel="Crear Cliente"
        isSubmitting={isCreating}
      />
    </div>
  );
}
