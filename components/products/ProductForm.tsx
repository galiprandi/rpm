'use client';

import * as React from 'react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';
import { X, Upload } from 'lucide-react';

export interface ProductFormData {
  barcode: string;
  sku: string;
  name: string;
  categoryId: string;
  supplierId: string;
  location: string;
  costPrice: string;
  replacementCost: string;
  stock: string;
  minStock: string;
  description: string;
  imageFile?: File;
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
  currentImageUrl?: string | null;
  productId?: string | null;
  onDeleteImage?: (productId: string) => void;
  isDeletingImage?: boolean;
  onImageDeleteStart?: () => void;
  onImageDeleteEnd?: () => void;
}

export function ProductForm({
  formData,
  setFormData,
  categories,
  suppliers,
  onSubmit,
  currentImageUrl,
  productId,
  onDeleteImage,
  isDeletingImage = false,
  onImageDeleteStart,
  onImageDeleteEnd,
}: ProductFormProps) {
  const [localImageUrl, setLocalImageUrl] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
    }
  };

  const handleRemoveImage = async () => {
    // If there's a current image (product already has an image), delete it from server
    if (currentImageUrl && productId && onDeleteImage) {
      onImageDeleteStart?.();
      try {
        await onDeleteImage(productId);
        // Clear local preview after successful deletion
        setLocalImageUrl(null);
      } finally {
        onImageDeleteEnd?.();
      }
    }
    // Clear the selected file from form
    setFormData({ ...formData, imageFile: undefined });
  };

  const imagePreview = formData.imageFile
    ? URL.createObjectURL(formData.imageFile)
    : localImageUrl || null;

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
          <Label htmlFor="name" required>Producto</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Barra LED 20 pulgadas"
            required
            aria-required="true"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId" required>Categoría</Label>
          <NativeSelect
            id="categoryId"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full"
            required
            aria-required="true"
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
          <Label htmlFor="supplierId" required>Proveedor</Label>
          <NativeSelect
            id="supplierId"
            value={formData.supplierId}
            onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
            className="w-full"
            required
            aria-required="true"
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
          <Label htmlFor="costPrice" required>Costo</Label>
          <Input
            id="costPrice"
            type="number"
            min="0"
            step="0.01"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
            placeholder="45000"
            required
            aria-required="true"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="replacementCost" required>Costo de Reposición</Label>
          <Input
            id="replacementCost"
            type="number"
            min="0"
            step="0.01"
            value={formData.replacementCost}
            onChange={(e) => setFormData({ ...formData, replacementCost: e.target.value })}
            placeholder="45000"
            required
            aria-required="true"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock" required>Stock</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            placeholder="15"
            required
            aria-required="true"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minStock" required>Mínimo</Label>
          <Input
            id="minStock"
            type="number"
            min="0"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            placeholder="5"
            required
            aria-required="true"
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

      {/* Fila 6: Imagen */}
      <div className="space-y-2">
        <Label htmlFor="image">Imagen (opcional)</Label>
        {imagePreview ? (
          <div className="flex items-start gap-4">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
              <Image
                src={imagePreview}
                alt="Preview"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveImage}
                loading={isDeletingImage}
                className="mb-2"
              >
                <X className="h-4 w-4 mr-2" />
                Eliminar imagen
              </Button>
              <p className="text-xs text-muted-foreground">
                {formData.imageFile ? 'Nueva imagen seleccionada' : 'Imagen actual'}
              </p>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-lg p-6 transition-colors hover:border-primary/50 hover:bg-muted/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-ring">
            <input
              id="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="sr-only"
            />
            <label
              htmlFor="image"
              className="flex flex-col items-center justify-center cursor-pointer group"
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
              <span className="text-sm text-muted-foreground">
                Click para subir imagen
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                JPEG, PNG o WebP (máx 10MB)
              </span>
            </label>
          </div>
        )}
      </div>
    </form>
  );
}
