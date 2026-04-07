import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { formatARS, formatPercentageChange } from '@/lib/utils/format';

interface SalesCardProps {
  total: number;
  workOrderCount: number;
  vsYesterday: number;
  ticketAverage: number;
}

export function SalesCard({
  total,
  workOrderCount,
  vsYesterday,
  ticketAverage,
}: SalesCardProps) {
  const trend = formatPercentageChange(vsYesterday);
  const TrendIcon = vsYesterday >= 0 ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Ventas Hoy
        </CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatARS(total)}</div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">
            {workOrderCount} OT{workOrderCount !== 1 ? 's' : ''} completada{workOrderCount !== 1 ? 's' : ''}
          </p>
          <div className={`flex items-center gap-1 text-xs ${trend.className}`}>
            <TrendIcon className="h-3 w-3" />
            <span>{trend.text}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Ticket promedio: {formatARS(ticketAverage)}
        </p>
      </CardContent>
    </Card>
  );
}
