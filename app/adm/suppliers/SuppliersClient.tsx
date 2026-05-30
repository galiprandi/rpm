'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUI } from '@/components/ui/UIProvider';
import { SupplierDialog } from '@/components/suppliers/SupplierDialog';
import { type SupplierFormData } from '@/components/suppliers/SupplierForm';
import { Header, CrudAdmin, CrudStats, type StatItem } from '@/components/adm';
import {
  Truck,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Building2,
  Package,
  Plus
} from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  productCount: number;
}

interface SuppliersClientProps {
  initialSuppliers: Supplier[];
}

export default function SuppliersClient({ initialSuppliers }: SuppliersClientProps) {
  const { alert, confirm } = useUI();
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState<SupplierFormData>({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<SupplierFormData>({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/suppliers?includeInactive=true');
      const data = await response.json();
      if (data.suppliers) {
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!createForm.name.trim()) return;

    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        setCreateForm({
          name: '',
          contactName: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
        });
        setIsCreateDialogOpen(false);
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
    }
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    const confirmed = await confirm({
      title: 'Desactivar Proveedor',
      description: `¿Estás seguro de desactivar "${supplier.name}"?`,
      confirmText: 'Desactivar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditForm({
      name: supplier.name,
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleEditSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingSupplier) return;

    try {
      const response = await fetch(`/api/suppliers/${editingSupplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setEditingSupplier(null);
        fetchSuppliers();
      } else {
        const error = await response.json();
        await alert({
          title: 'Error',
          description: error.error || 'Error al actualizar proveedor',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      await alert({
        title: 'Error',
        description: 'Error al actualizar proveedor',
        variant: 'error',
      });
    }
  };

  const stats: StatItem[] = [
    {
      label: 'Total',
      value: suppliers.length,
      icon: Building2,
    },
    {
      label: 'Activos',
      value: suppliers.filter((s) => s.isActive).length,
      icon: Truck,
      iconColor: 'rgb(34 197 94)', // text-green-500
    },
    {
      label: 'Con productos',
      value: suppliers.filter((s) => s.productCount > 0).length,
      icon: Package,
    },
  ];

  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
              <Truck className="h-3 w-3 text-slate-600" />
            </div>
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'contactName',
        header: 'Contacto',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.contactName || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Teléfono',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-sm">
            {row.original.phone && <Phone className="h-3 w-3 text-muted-foreground" />}
            <span>{row.original.phone || '-'}</span>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-sm">
            {row.original.email && <Mail className="h-3 w-3 text-muted-foreground" />}
            <span>{row.original.email || '-'}</span>
          </div>
        ),
      },
      {
        accessorKey: 'productCount',
        header: 'Productos',
        cell: ({ row }) => <span>{row.original.productCount}</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Estado',
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge variant="default">Activo</Badge>
          ) : (
            <Badge variant="destructive">Inactivo</Badge>
          ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <Header
        title="Proveedores"
        description="Gestiona los proveedores de productos y repuestos"
        secondaryActions={[
          {
            label: 'Comprobantes',
            href: '/adm/purchase-vouchers',
            variant: 'outline',
          },
        ]}
        primaryAction={{
          label: 'Nuevo Proveedor',
          onClick: () => setIsCreateDialogOpen(true),
          icon: Plus,
          ariaLabel: 'Crear nuevo proveedor',
        }}
      >
        <div className="mt-4">
          <CrudStats stats={stats} />
        </div>
      </Header>

      <CrudAdmin
        title=""
        description=""
        items={suppliers}
        loading={loading}
        onCreate={() => setIsCreateDialogOpen(true)}
        hideCreateAction
        columns={columns}
        emptyIcon={<Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
        emptyMessage="No hay proveedores creados. Haz clic en 'Nuevo Proveedor' para crear el primero."
        createButtonText="Proveedor"
        tableTitle="Listado de Proveedores"
        searchPlaceholder="Buscar proveedores..."
        rowActions={(supplier) => (
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(supplier)}
                  aria-label="Editar proveedor"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar proveedor</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDeleteSupplier(supplier)}
                  disabled={supplier.productCount > 0}
                  aria-label="Eliminar proveedor"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {supplier.productCount > 0
                  ? 'No se puede eliminar un proveedor con productos asociados'
                  : 'Eliminar proveedor'}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      />

      {/* Create Supplier Dialog */}
      <SupplierDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        editingSupplier={null}
        formData={createForm}
        setFormData={setCreateForm}
        onSubmit={(e) => {
          e?.preventDefault();
          handleCreateSupplier();
        }}
      />

      {/* Edit Supplier Dialog */}
      <SupplierDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        editingSupplier={editingSupplier}
        formData={editForm}
        setFormData={setEditForm}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}
