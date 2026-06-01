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
        primaryAction={{
          label: 'Finalizar Carga',
          disabled: true,
        }}
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
          <div className="bg-card border rounded-xl shadow-xs overflow-hidden h-96">
            <Skeleton className="h-full w-full" />
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
