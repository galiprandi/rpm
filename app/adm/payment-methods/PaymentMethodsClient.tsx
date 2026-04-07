'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { CrudAdmin } from '@/components/adm/CrudAdmin';
import { PaymentMethodForm, PaymentMethodFormData } from '@/components/payment-methods/PaymentMethodForm';
import { ModalBase } from '@/components/ui/ModalBase';
import { useUI } from '@/components/ui/UIProvider';
import { Pencil, Trash2 } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: {
    payments: number;
  };
}

interface PaymentMethodsClientProps {
  initialPaymentMethods: PaymentMethod[];
}

const defaultFormData: PaymentMethodFormData = {
  name: '',
  code: '',
  description: '',
  sortOrder: 0,
  isActive: true,
};

export default function PaymentMethodsClient({ initialPaymentMethods }: PaymentMethodsClientProps) {
  const { alert, confirm } = useUI();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<PaymentMethodFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const res = await fetch('/api/payment-methods');
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.paymentMethods || []);
      } else {
        await alert({
          title: 'Error',
          description: 'No se pudieron cargar los métodos de pago',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      await alert({
        title: 'Error',
        description: 'Error al cargar métodos de pago',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [alert]);

  const handleCreate = () => {
    setEditingMethod(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      code: method.code,
      description: method.description || '',
      sortOrder: method.sortOrder,
      isActive: method.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (method: PaymentMethod) => {
    const hasPayments = method._count?.payments && method._count.payments > 0;
    
    if (hasPayments) {
      await alert({
        title: 'No se puede eliminar',
        description: `El método "${method.name}" tiene ${method._count?.payments} pagos asociados. Solo se puede desactivar.`,
        variant: 'error',
      });
      return;
    }

    const confirmed = await confirm({
      title: 'Eliminar método de pago',
      description: `¿Está seguro de eliminar "${method.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/payment-methods/${method.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await alert({
          title: 'Eliminado',
          description: 'Método de pago eliminado correctamente',
          variant: 'success',
        });
        fetchPaymentMethods();
      } else {
        const error = await res.json();
        await alert({
          title: 'Error',
          description: error.error || 'No se pudo eliminar el método de pago',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      await alert({
        title: 'Error',
        description: 'Error al eliminar el método de pago',
        variant: 'error',
      });
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = editingMethod 
        ? `/api/payment-methods/${editingMethod.id}`
        : '/api/payment-methods';
      const method = editingMethod ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await alert({
          title: editingMethod ? 'Actualizado' : 'Creado',
          description: editingMethod 
            ? 'Método de pago actualizado correctamente'
            : 'Método de pago creado correctamente',
          variant: 'success',
        });
        setIsDialogOpen(false);
        fetchPaymentMethods();
      } else {
        const error = await res.json();
        await alert({
          title: 'Error',
          description: error.error || 'No se pudo guardar el método de pago',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      await alert({
        title: 'Error',
        description: 'Error al guardar el método de pago',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnDef<PaymentMethod>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'code',
      header: 'Código',
      cell: ({ row }) => (
        <code className="bg-muted px-2 py-1 rounded text-sm">{row.original.code}</code>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Descripción',
      cell: ({ row }) => row.original.description || '-',
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            row.original.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.original.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  const rowActions = (method: PaymentMethod) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleEdit(method)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDelete(method)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <CrudAdmin
        title="Métodos de Pago"
        description="Administrar métodos de pago disponibles"
        items={paymentMethods}
        loading={loading}
        onCreate={handleCreate}
        columns={columns}
        emptyMessage="No hay métodos de pago configurados"
        emptyActionText="Crear primero"
        createButtonText="Nuevo Método"
        tableTitle="Listado"
        enableSearch={true}
        searchPlaceholder="Buscar métodos de pago..."
        enableExport={true}
        exportFilename="payment-methods.csv"
        rowActions={rowActions}
      />

      <ModalBase
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
      >
        <div className="space-y-4">
          <PaymentMethodForm
            formData={formData}
            setFormData={setFormData}
            isEdit={!!editingMethod}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={saving}
              form="payment-method-form"
            >
              {saving ? 'Guardando...' : editingMethod ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      </ModalBase>
    </div>
  );
}
