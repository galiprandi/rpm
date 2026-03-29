'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ProductFormData {
  barcode: string;
  sku: string;
  name: string;
  categoryId: string;
  supplier: string;
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

interface ProductFormProps {
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
  categories: Category[];
  onSubmit?: (e: React.FormEvent) => void;
}

export function ProductForm({
  formData,
  setFormData,
  categories,
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
          <Label htmlFor="barcode">Código de Barras (EAN) *</Label>
          <Input
            id="barcode"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            placeholder="1234567890123"
            required
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
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          >
            <SelectTrigger id="categoryId">
              <SelectValue placeholder="Selecciona categoría" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-50 max-h-60">
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fila 3: Proveedor | Ubicación */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="supplier">Proveedor *</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            placeholder="Nombre del proveedor"
            required
          />
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
