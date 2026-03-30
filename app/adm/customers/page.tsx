"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CrudAdmin } from "@/components/adm";
import { Eye, FilePlus, Phone, User } from "lucide-react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";

interface Customer {
  id: string;
  name: string;
  phone: string;
  phoneAlt?: string;
  email?: string;
  billingData?: {
    cuit: string;
    invoiceType: string;
  };
  vehicles: Array<{
    id: string;
    identifier: string;
    category: string;
  }>;
  _count: {
    workOrders: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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
          <div>
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {row.original.phone}
            </div>
            {row.original.phoneAlt && (
              <div className="text-sm text-muted-foreground">
                Alt: {row.original.phoneAlt}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "vehicles",
        header: "Vehículos",
        cell: ({ row }) => {
          const vehicles = row.original.vehicles;
          if (vehicles.length === 0) {
            return <span className="text-sm text-muted-foreground">Sin vehículos</span>;
          }
          return (
            <div className="flex flex-col gap-1">
              {vehicles.slice(0, 2).map((v) => (
                <span
                  key={v.id}
                  className="text-sm bg-muted px-2 py-0.5 rounded"
                >
                  {v.identifier}
                </span>
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
        accessorKey: "_count.workOrders",
        header: "OTs",
        cell: ({ row }) => (
          <span className="font-medium">{row.original._count.workOrders}</span>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Link href={`/adm/customers/${row.original.id}`}>
              <Button variant="ghost" size="sm" title="Ver cliente">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/adm/work-orders/new?customerId=${row.original.id}`}>
              <Button variant="ghost" size="sm" title="Nueva OT">
                <FilePlus className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  const handleCreate = () => {
    window.location.href = "/adm/customers/new";
  };

  return (
    <CrudAdmin
      title="Clientes"
      description="Gestiona las fichas de tus clientes"
      items={customers}
      loading={loading}
      onCreate={handleCreate}
      columns={columns}
      emptyIcon={<User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
      emptyMessage="No hay clientes registrados. Haz clic en 'Nuevo Cliente' para crear el primero."
      createButtonText="Nuevo Cliente"
      tableTitle="Listado de Clientes"
      searchPlaceholder="Buscar por nombre o teléfono..."
    />
  );
}
