import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  trend,
  trendValue,
  className,
}) => {
  const getTrendColor = () => {
    if (!trend) return '';
    
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-destructive';
      case 'neutral':
        return 'text-muted-foreground';
      default:
        return '';
    }
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <Icon
            className={cn('h-4 w-4', iconClassName || 'text-muted-foreground')}
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(subtitle || trendValue) && (
          <div className="flex items-center gap-2 mt-1">
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trendValue && (
              <span className={cn('text-xs font-medium', getTrendColor())}>
                {trendValue}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
