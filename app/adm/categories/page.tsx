'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModalBase, ModalBaseFooter } from '@/components/ui/ModalBase';
import { useUI } from '@/components/ui/UIProvider';
import { CategoryForm, type CategoryFormData } from '@/components/categories/CategoryForm';
import { CrudAdmin, StatItem } from '@/components/adm';
import { Folder, Edit2, Trash2, Package, Layers } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';

interface Category {
  id: string;
  name: string;
  description: string | null;
  defaultMarginPercent: number;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export default function CategoriesPage() {
  const { alert, confirm } = useUI();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [createForm, setCreateForm] = useState<CategoryFormData>({
    name: '',
    description: '',
    defaultMarginPercent: 40,
    color: '',
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<CategoryFormData>({
    name: '',
    description: '',
    defaultMarginPercent: 40,
    color: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?includeInactive=true');
      const data = await response.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!createForm.name.trim()) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        setCreateForm({
          name: '',
          description: '',
          defaultMarginPercent: 40,
          color: '',
        });
        setIsCreateDialogOpen(false);
        fetchCategories();
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    const confirmed = await confirm({
      title: 'Desactivar Categoría',
      description: `¿Estás seguro de desactivar "${category.name}"?`,
      confirmText: 'Desactivar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setEditForm({
      name: category.name,
      description: category.description || '',
      defaultMarginPercent: category.defaultMarginPercent,
      color: category.color || '',
    });
    setIsDialogOpen(true);
  };

  const handleEditSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingCategory) return;

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        const error = await response.json();
        await alert({
          title: 'Error',
          description: error.error || 'Error al actualizar categoría',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating category:', error);
      await alert({
        title: 'Error',
        description: 'Error al actualizar categoría',
        variant: 'error',
      });
    }
  };

  const stats: StatItem[] = [
    {
      label: 'Total',
      value: categories.length,
      icon: Layers,
    },
    {
      label: '+ Categorías Activas',
      value: categories.filter((c) => c.isActive).length,
      icon: Folder,
      iconColor: '#22c55e',
    },
    {
      label: 'Productos',
      value: categories.reduce((acc, c) => acc + c.productCount, 0),
      icon: Package,
    },
  ];

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ backgroundColor: row.original.color || '#e5e7eb' }}
            >
              <Folder className="h-3 w-3 text-white" />
            </div>
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Descripción',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.description || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'productCount',
        header: 'Productos',
        cell: ({ row }) => <span>{row.original.productCount}</span>,
      },
      {
        accessorKey: 'defaultMarginPercent',
        header: 'Margen',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.defaultMarginPercent}%</Badge>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Estado',
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge variant="default">Activa</Badge>
          ) : (
            <Badge variant="destructive">Inactiva</Badge>
          ),
      },
    ],
    []
  );

  return (
    <>
      <CrudAdmin
        title="Categorías"
        description="Gestiona las categorías de productos"
        items={categories}
        loading={loading}
        onCreate={() => setIsCreateDialogOpen(true)}
        columns={columns}
        stats={stats}
        emptyIcon={<Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
        emptyMessage="No hay categorías creadas. Haz clic en '+ Categoría' para crear la primera."
        createButtonText="Categoría"
        tableTitle="Listado de Categorías"
        searchPlaceholder="Buscar categorías..."
        rowActions={(category) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)} title="Editar categoría">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={() => handleDeleteCategory(category)}
              disabled={category.productCount > 0}
              title="Eliminar categoría"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      {/* Edit Category Modal */}
      <ModalBase
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Editar Categoría"
        description="Modifica los datos de la categoría."
        maxWidth="md"
        footer={
          <ModalBaseFooter
            onCancel={() => setIsDialogOpen(false)}
            onSave={() => handleEditSubmit({ preventDefault: () => {} } as React.FormEvent)}
            saveText="Guardar Cambios"
          />
        }
      >
        <CategoryForm formData={editForm} setFormData={setEditForm} onSubmit={handleEditSubmit} />
      </ModalBase>

      {/* Create Category Modal */}
      <ModalBase
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        title="Nueva Categoría"
        description="Completa los datos para crear una nueva categoría."
        maxWidth="md"
        footer={
          <ModalBaseFooter
            onCancel={() => setIsCreateDialogOpen(false)}
            onSave={handleCreateCategory}
            saveText="Crear Categoría"
          />
        }
      >
        <CategoryForm
          formData={createForm}
          setFormData={setCreateForm}
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateCategory();
          }}
        />
      </ModalBase>
    </>
  );
}
