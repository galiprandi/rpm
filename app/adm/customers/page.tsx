"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Phone, User } from "lucide-react";
import Link from "next/link";

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  phoneAlt?: string;
  email?: string;
  documentType: string;
  documentNumber: string;
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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "50");

      const response = await fetch(`/api/customers?${params}`);
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setCustomers(data.customers);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            <User className="h-6 w-6" />
            Clientes
          </CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, teléfono o documento..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9 w-80"
              />
            </div>
            <Link href="/adm/customers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Vehículos</TableHead>
                <TableHead>OTs</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {search
                      ? "No se encontraron clientes con ese criterio"
                      : "No hay clientes registrados"}
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium">{customer.fullName}</div>
                      {customer.email && (
                        <div className="text-sm text-muted-foreground">
                          {customer.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </div>
                      {customer.phoneAlt && (
                        <div className="text-sm text-muted-foreground">
                          Alt: {customer.phoneAlt}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.documentType} {customer.documentNumber}
                    </TableCell>
                    <TableCell>
                      {customer.vehicles.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {customer.vehicles.slice(0, 2).map((v) => (
                            <span
                              key={v.id}
                              className="text-sm bg-muted px-2 py-0.5 rounded"
                            >
                              {v.identifier}
                            </span>
                          ))}
                          {customer.vehicles.length > 2 && (
                            <span className="text-sm text-muted-foreground">
                              +{customer.vehicles.length - 2} más
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Sin vehículos
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {customer._count.workOrders}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/adm/customers/${customer.id}`}>
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                        </Link>
                        <Link href={`/adm/work-orders/new?customerId=${customer.id}`}>
                          <Button variant="secondary" size="sm">
                            Nueva OT
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {customers.length} de {total} clientes
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
