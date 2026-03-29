'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModalBase, ModalBaseFooter } from '@/components/ui/ModalBase';
import { useUI } from '@/components/ui/UIProvider';
import { SupplierForm, type SupplierFormData } from '@/components/suppliers/SupplierForm';
import { CrudAdmin, StatItem } from '@/components/adm';
import {
  Truck,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building2,
  Package
} from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';

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

export default function SuppliersPage() {
  const { alert, confirm } = useUI();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
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
      iconColor: '#22c55e',
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
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => openEditDialog(row.original)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={() => handleDeleteSupplier(row.original)}
              disabled={row.original.productCount > 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando proveedores...</div>
      </div>
    );
  }

  return (
    <>
      <CrudAdmin
        title="Proveedores"
        description="Gestiona los proveedores de productos"
        items={suppliers}
        loading={loading}
        onCreate={() => setIsCreateDialogOpen(true)}
        columns={columns}
        stats={stats}
        emptyIcon={<Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
        emptyMessage="No hay proveedores creados. Crea el primero arriba."
        createButtonText="Nuevo Proveedor"
        tableTitle="Listado de Proveedores"
        searchPlaceholder="Buscar proveedores..."
      />

      {/* Create Supplier Modal */}
      <ModalBase
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        title="Nuevo Proveedor"
        description="Completa los datos para crear un nuevo proveedor."
        maxWidth="md"
        footer={
          <ModalBaseFooter
            onCancel={() => setIsCreateDialogOpen(false)}
            onSave={handleCreateSupplier}
            saveText="Crear Proveedor"
          />
        }
      >
        <SupplierForm
          formData={createForm}
          setFormData={setCreateForm}
          onSubmit={(e) => { e.preventDefault(); handleCreateSupplier(); }}
        />
      </ModalBase>

      {/* Edit Supplier Modal */}
      <ModalBase
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Editar Proveedor"
        description="Modifica los datos del proveedor."
        maxWidth="md"
        footer={
          <ModalBaseFooter
            onCancel={() => setIsDialogOpen(false)}
            onSave={() => handleEditSubmit({ preventDefault: () => {} } as React.FormEvent)}
            saveText="Guardar Cambios"
          />
        }
      >
        <SupplierForm formData={editForm} setFormData={setEditForm} onSubmit={handleEditSubmit} />
      </ModalBase>
    </>
  );
}
