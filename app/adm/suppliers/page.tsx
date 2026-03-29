'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { useUI } from '@/components/ui/UIProvider';
import { SupplierForm, type SupplierFormData } from '@/components/suppliers/SupplierForm';
import { 
  Truck, 
  Plus, 
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

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
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Desactivar Proveedor',
      description: `¿Estás seguro de desactivar "${name}"?`,
      confirmText: 'Desactivar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/suppliers/${id}`, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando proveedores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proveedores</h1>
          <p className="text-muted-foreground">
            Gestiona los proveedores de productos
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          variant="default"
          className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold px-4 py-2"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Create Supplier Modal */}
      <Modal
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        title="Nuevo Proveedor"
        description="Completa los datos para crear un nuevo proveedor."
        size="md"
        footer={
          <ModalFooter
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
      </Modal>

      {/* Suppliers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className={!supplier.isActive ? 'opacity-60' : ''}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{supplier.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {supplier.productCount} productos
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(supplier)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                    disabled={supplier.productCount > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {supplier.contactName && (
                  <p className="text-muted-foreground">
                    Contacto: {supplier.contactName}
                  </p>
                )}
                
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {supplier.phone}
                  </div>
                )}
                
                {supplier.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {supplier.email}
                  </div>
                )}
                
                {supplier.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {supplier.address}
                  </div>
                )}
                
                <div className="flex items-center gap-2 pt-2">
                  {!supplier.isActive && (
                    <Badge variant="destructive">Inactivo</Badge>
                  )}
                  {supplier.name === 'Sin especificar' && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {suppliers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay proveedores creados. Crea el primero arriba.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Supplier Modal */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Editar Proveedor"
        description="Modifica los datos del proveedor."
        size="md"
        footer={
          <ModalFooter
            onCancel={() => setIsDialogOpen(false)}
            onSave={() => handleEditSubmit({ preventDefault: () => {} } as React.FormEvent)}
            saveText="Guardar Cambios"
          />
        }
      >
        <SupplierForm
          formData={editForm}
          setFormData={setEditForm}
          onSubmit={handleEditSubmit}
        />
      </Modal>
    </div>
  );
}
