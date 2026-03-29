'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Modal, ModalFooter } from '@/components/ui/modal';
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
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
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (response.ok) {
        setNewCategoryName('');
        fetchCategories();
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Estás seguro de desactivar esta categoría?')) return;

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
        alert(error.error || 'Error al actualizar categoría');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Error al actualizar categoría');
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
      </div>

      {/* Create Category Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nueva Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Nombre de la categoría..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
              className="flex-1 max-w-md"
            />
            <Button onClick={handleCreateCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Categoría
            </Button>
          </div>
        </CardContent>
      </Card>

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
                    onClick={() => handleDeleteCategory(category.id)}
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
              No hay categorías creadas. Crea la primera arriba.
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
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              placeholder="Nombre de la categoría"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={editForm.description}
              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              placeholder="Descripción de la categoría..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultMarginPercent">Margen Sugerido (%)</Label>
              <Input
                id="defaultMarginPercent"
                type="number"
                min="0"
                max="100"
                value={editForm.defaultMarginPercent}
                onChange={(e) => setEditForm({...editForm, defaultMarginPercent: parseInt(e.target.value) || 0})}
                placeholder="40"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={editForm.color || '#e5e7eb'}
                onChange={(e) => setEditForm({...editForm, color: e.target.value})}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
