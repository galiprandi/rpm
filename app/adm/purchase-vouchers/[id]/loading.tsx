'use client';

import { Header } from '@/components/adm';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, DollarSign } from 'lucide-react';

export default function VoucherDetailLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Header
        title="Comprobante ..."
        description="Proveedor: ..."
        showBackButton
      >
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="h-6 w-28 rounded-md" />
        </div>
      </Header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl shadow-xs overflow-hidden h-48">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="bg-card border rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 bg-muted/50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="p-0">
              <div className="border-b px-6 py-3 flex gap-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-6 py-4 flex gap-4 items-center border-b last:border-0">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-xl shadow-xs p-6 h-80">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
