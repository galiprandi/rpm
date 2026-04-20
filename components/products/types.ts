export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  costPrice: number;
  replacementCost: number;
  stock: number;
  minStock: number;
  supplierId: string | null;
  supplier: {
    id: string;
    name: string;
  } | null;
  barcode: string | null;
  location: string | null;
  isActive: boolean;
  categoryId: string;
  category: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  margin: number;
  isLowStock: boolean;
  imageUrl?: string | null;
  imageCommit?: string | null;
  imageBranch?: string | null;
}

export interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  costPrice: string;
  replacementCost: string;
  stock: string;
  minStock: string;
  categoryId: string;
  supplierId: string;
  barcode: string;
  location: string;
  imageFile?: File;
}

export interface Category {
  id: string;
  name: string;
  color: string | null;
}

export interface Supplier {
  id: string;
  name: string;
}
