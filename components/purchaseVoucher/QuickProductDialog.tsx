'use client';

import { useState, useEffect } from 'react';
import { ModalBase } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/button';
import { ProductForm, type ProductFormData } from '@/components/products/ProductForm';
import { useUI } from '@/components/ui/UIProvider';

interface QuickProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: (product: { id: string; name: string; sku?: string }) => void;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface SupplierOption {
  id: string;
  name: string;
}

const defaultFormData: ProductFormData = {
  barcode: '',
  sku: '',
  name: '',
  categoryId: '',
  supplierId: '',
  location: '',
  costPrice: '',
  replacementCost: '',
  stock: '0',
  minStock: '0',
  description: '',
};

export function QuickProductDialog({ isOpen, onClose, onProductCreated }: QuickProductDialogProps) {
  const { alert } = useUI();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const loadDeps = async () => {
      try {
        const [catRes, supRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/suppliers'),
        ]);
        if (catRes.ok) {
          const d = await catRes.json();
          setCategories(d.categories || []);
        }
        if (supRes.ok) {
          const d = await supRes.json();
          setSuppliers(d.suppliers || []);
        }
      } catch (err) {
        console.error('Error loading dependencies:', err);
      }
    };
    loadDeps();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId) {
      await alert({ title: 'Campos requeridos', description: 'Nombre y categoría son obligatorios', variant: 'error' });
      return;
    }
    if (!formData.costPrice || !formData.replacementCost) {
      await alert({ title: 'Campos requeridos', description: 'Costo y costo de reposición son obligatorios', variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          barcode: formData.barcode || undefined,
          sku: formData.sku || undefined,
          categoryId: formData.categoryId,
          supplierId: formData.supplierId || undefined,
          location: formData.location || undefined,
          costPrice: parseFloat(formData.costPrice),
          replacementCost: parseFloat(formData.replacementCost),
          stock: parseInt(formData.stock) || 0,
          minStock: parseInt(formData.minStock) || 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al crear producto');
      }

      const product = await res.json();
      onProductCreated?.(product);
      setFormData(defaultFormData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear producto';
      await alert({ title: 'Error', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Producto Rápido"
      description="Alta rápida de producto para continuar la carga"
      maxWidth="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="quick-product-form" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Producto'}
          </Button>
        </div>
      }
    >
      <ProductForm
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        suppliers={suppliers}
        onSubmit={handleSubmit}
      />
    </ModalBase>
  );
}
