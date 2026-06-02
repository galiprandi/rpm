import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface StockAlertCardProps {
  lowStockCount: number;
  lowStockItems: Array<{
    id: string;
    name: string;
    stock: number;
    minStock: number;
  }>;
}

export function StockAlertCard({
  lowStockCount,
  lowStockItems,
}: StockAlertCardProps) {
  const hasAlerts = lowStockCount > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Alertas Stock
        </CardTitle>
        <Package className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {hasAlerts ? (
            <span className="text-orange-600">{lowStockCount} productos</span>
          ) : (
            <span className="text-emerald-600">OK</span>
          )}
        </div>
        {hasAlerts ? (
          <>
            <p className="text-xs text-muted-foreground mt-1">
              {lowStockItems.slice(0, 3).map((item) => item.name).join(', ')}
              {lowStockItems.length > 3 && '...'}
            </p>
            <Link href="/adm/products?lowStock=true">
              <Button variant="link" className="p-0 h-auto text-xs mt-2">
                Ver lista
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">
            Stock en niveles normales
          </p>
        )}
      </CardContent>
    </Card>
  );
}
