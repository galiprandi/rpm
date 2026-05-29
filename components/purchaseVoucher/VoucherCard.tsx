// components/purchaseVoucher/VoucherCard.tsx
import React from 'react';
import Link from 'next/link';

interface VoucherCardProps {
  id: string;
  supplierName: string;
  status: string;
  createdAt: string;
}

export const VoucherCard: React.FC<VoucherCardProps> = ({ id, supplierName, status, createdAt }) => {
  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold mb-2">Voucher {id.slice(0, 8)}…</h3>
      <p className="text-gray-600">Supplier: {supplierName}</p>
      <p className="text-gray-600">Status: {status}</p>
      <p className="text-gray-500 text-sm">Created: {new Date(createdAt).toLocaleDateString()}</p>
      <Link href={`/adm/purchase-vouchers/${id}`} className="mt-2 inline-block text-primary underline">
        View details
      </Link>
    </div>
  );
};

export default VoucherCard;

