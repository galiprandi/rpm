'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { useUI } from '@/components/ui/UIProvider';
import { CategoryForm, type CategoryFormData } from '@/components/categories/CategoryForm';
import { 
  Folder, 
  Plus, 
  Edit2,
  Trash2,
  Package
} from 'lucide-react';

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
        fetchCategories();
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Desactivar Categoría',
      description: `¿Estás seguro de desactivar "${name}"?`,
      confirmText: 'Desactivar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando categorías...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categorías</h1>
          <p className="text-muted-foreground">
            Gestiona las categorías de productos
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          variant="default"
          className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold px-4 py-2"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className={!category.isActive ? 'opacity-60' : ''}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: category.color || '#e5e7eb' }}
                  >
                    <Folder className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.productCount} productos
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                    disabled={category.productCount > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {category.description && (
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">
                    Margen sugerido: {category.defaultMarginPercent}%
                  </Badge>
                  {!category.isActive && (
                    <Badge variant="destructive">Inactiva</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay categorías creadas. Haz clic en &quot;Nueva Categoría&quot; para crear la primera.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Category Modal */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Editar Categoría"
        description="Modifica los datos de la categoría."
        size="md"
        footer={
          <ModalFooter
            onCancel={() => setIsDialogOpen(false)}
            onSave={() => handleEditSubmit({ preventDefault: () => {} } as React.FormEvent)}
            saveText="Guardar Cambios"
          />
        }
      >
        <CategoryForm
          formData={editForm}
          setFormData={setEditForm}
          onSubmit={handleEditSubmit}
        />
      </Modal>

      {/* Create Category Modal */}
      <Modal
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        title="Nueva Categoría"
        description="Completa los datos para crear una nueva categoría."
        size="md"
        footer={
          <ModalFooter
            onCancel={() => setIsCreateDialogOpen(false)}
            onSave={handleCreateCategory}
            saveText="Crear Categoría"
          />
        }
      >
        <CategoryForm
          formData={createForm}
          setFormData={setCreateForm}
          onSubmit={(e) => { e.preventDefault(); handleCreateCategory(); }}
        />
      </Modal>
    </div>
  );
}
