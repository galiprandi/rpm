export interface PurchaseVoucherItem {
  id: string;
  voucherId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: string;
  subtotal: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseVoucher {
  id: string;
  supplierId: string;
  supplierName?: string;
  supplier?: {
    name: string;
  };
  letter: string;
  number: string;
  date: string;
  totalAmount: string;
  paymentMethodId: string | null;
  notes: string | null;
  status: 'DRAFT' | 'FINALIZED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  finalizedAt: string | null;
  items?: PurchaseVoucherItem[];
  itemsCount?: number;
  itemsSubtotal?: number;
}
