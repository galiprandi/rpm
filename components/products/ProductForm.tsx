'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

export interface ProductFormData {
  barcode: string;
  sku: string;
  name: string;
  categoryId: string;
  supplierId: string;
  location: string;
  costPrice: string;
  salePrice: string;
  stock: string;
  minStock: string;
  description: string;
}

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface ProductFormProps {
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
  categories: Category[];
  suppliers: Supplier[];
  onSubmit?: (e: React.FormEvent) => void;
  isValid?: boolean;
}

export function ProductForm({
  formData,
  setFormData,
  categories,
  suppliers,
  onSubmit,
}: ProductFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
      {/* Fila 1: EAN | SKU */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="barcode">Código de Barras (EAN)</Label>
          <Input
            id="barcode"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            placeholder="1234567890123 (opcional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="LED-001 (opcional)"
          />
        </div>
      </div>

      {/* Fila 2: Producto | Categoría */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Producto *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Barra LED 20 pulgadas"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoría *</Label>
          <NativeSelect
            id="categoryId"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full"
            required
          >
            <NativeSelectOption value="">Selecciona categoría</NativeSelectOption>
            {categories.map((cat) => (
              <NativeSelectOption key={cat.id} value={cat.id}>
                {cat.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>

      {/* Fila 3: Proveedor | Ubicación */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="supplierId">Proveedor *</Label>
          <NativeSelect
            id="supplierId"
            value={formData.supplierId}
            onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
            className="w-full"
            required
          >
            <NativeSelectOption value="">Selecciona proveedor</NativeSelectOption>
            {suppliers.map((sup) => (
              <NativeSelectOption key={sup.id} value={sup.id}>
                {sup.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ubicación</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Estante A-3"
          />
        </div>
      </div>

      {/* Fila 4: Costo | Venta | Stock | Mínimo */}
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="costPrice">Costo *</Label>
          <Input
            id="costPrice"
            type="number"
            min="0"
            step="0.01"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
            placeholder="45000"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="salePrice">Venta *</Label>
          <Input
            id="salePrice"
            type="number"
            min="0"
            step="0.01"
            value={formData.salePrice}
            onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
            placeholder="75000"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock *</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            placeholder="15"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minStock">Mínimo *</Label>
          <Input
            id="minStock"
            type="number"
            min="0"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            placeholder="5"
            required
          />
        </div>
      </div>

      {/* Fila 5: Descripción */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción del producto..."
          rows={2}
        />
      </div>
    </form>
  );
}
