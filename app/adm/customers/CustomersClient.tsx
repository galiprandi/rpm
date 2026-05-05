'use client';

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CrudAdmin } from "@/components/adm";
import { Phone, User, Eye, TrendingDown } from "lucide-react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { type CustomerFormData } from "@/components/customers/CustomerForm";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  phoneAlt?: string | null;
  email?: string | null;
  balance: number;
  billingData?: {
    cuit: string;
    invoiceType: string;
  } | null;
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

export default function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showOnlyWithBalance, setShowOnlyWithBalance] = useState(false);

  // Filter customers based on balance
  const filteredCustomers = useMemo(() => {
    if (!showOnlyWithBalance) return customers;
    return customers.filter(c => c.balance !== 0);
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
          <div>
            <div className="font-medium">{row.original.name}</div>
            {row.original.email && (
              <div className="text-sm text-muted-foreground">
                {row.original.email}
              </div>
            )}
            {row.original.billingData && (
              <div className="text-xs text-blue-600">
                Fact: {row.original.billingData.invoiceType} - CUIT: {row.original.billingData.cuit}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Teléfono",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {row.original.phone || <span className="text-muted-foreground">-</span>}
          </div>
        ),
      },
      {
        accessorKey: "vehicles",
        header: "Vehículos",
        cell: ({ row }) => {
          const vehicles = row.original.vehicles || [];
          if (!vehicles || vehicles.length === 0) {
            return <span className="text-sm text-muted-foreground">Sin vehículos</span>;
          }
          return (
            <div className="flex flex-col gap-1">
              {vehicles.slice(0, 2).map((v) => (
                <Link
                  key={v.id}
                  href={`/adm/vehicles/${v.id}`}
                  className="text-sm bg-muted px-2 py-0.5 rounded hover:bg-muted/80 hover:underline"
                >
                  {v.identifier}
                </Link>
              ))}
              {vehicles.length > 2 && (
                <span className="text-sm text-muted-foreground">
                  +{vehicles.length - 2} más
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "balance",
        header: "Saldo",
        cell: ({ row }) => {
          const balance = row.original.balance;
          if (balance === 0) {
            return <span className="text-muted-foreground">-</span>;
          }
          if (balance > 0) {
            return (
              <span className="font-medium text-red-600">
                {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                }).format(balance)}
              </span>
            );
          }
          // balance < 0 (saldo a favor)
          return (
            <span className="font-medium text-green-600">
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
              }).format(balance)}
            </span>
          );
        },
      },
      {
        accessorKey: "_count.workOrders",
        header: "OTs",
        cell: ({ row }) => (
          <span className="font-medium">{row.original._count.workOrders}</span>
        ),
      },
    ],
    []
  );

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (formData: CustomerFormData) => {
    setIsCreating(true);
    try {
      const payload = {
        ...formData,
        billingData: formData.billingData?.cuit ? formData.billingData : undefined,
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
    <>
      <CrudAdmin
        title="Clientes"
        description="Gestiona las fichas de tus clientes"
        items={filteredCustomers}
        loading={loading}
        onCreate={handleCreate}
        columns={columns}
        emptyIcon={<User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
        emptyMessage="No hay clientes registrados. Haz clic en 'Nuevo Cliente' para crear el primero."
        createButtonText="Cliente"
        tableTitle="Listado de Clientes"
        searchPlaceholder="Buscar por nombre o teléfono..."
        secondaryActions={[
          {
            label: showOnlyWithBalance ? 'Ver Todos' : 'Con Saldo',
            onClick: () => setShowOnlyWithBalance(!showOnlyWithBalance),
            variant: 'outline',
            icon: TrendingDown,
          },
        ]}
        rowActions={(customer) => (
          <Link href={`/adm/customers/${customer.id}`}>
            <Button variant="ghost" size="sm" title="Ver detalle">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
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
    </>
  );
}
