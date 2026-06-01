/**
 * StatsCards Component
 * Estadísticas compactas usando badges para mejor visual
 */

import { Badge } from '@/components/ui/badge';

interface StatItem {
  value: number;
  label: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
}

interface StatsCardsProps {
  stats: StatItem[];
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  green: 'bg-green-100 text-green-800 border-emerald-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-between">
      {stats.map((stat, index) => (
        <div key={index} className="flex flex-col items-center gap-1 min-w-0 flex-1">
          <Badge 
            variant="outline" 
            className={`${colorClasses[stat.color]} h-6 px-3 font-semibold text-sm`}
          >
            {stat.value}
          </Badge>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
