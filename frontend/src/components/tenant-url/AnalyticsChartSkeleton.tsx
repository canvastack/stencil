import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * AnalyticsChartSkeleton Component
 * 
 * Loading skeleton placeholder untuk analytics charts.
 * Digunakan selama data analytics sedang di-fetch dari API.
 * 
 * @component
 * @example
 * ```tsx
 * {isLoading && <AnalyticsChartSkeleton />}
 * ```
 * 
 * @returns {JSX.Element} Skeleton card dengan chart-like placeholders
 */
export default function AnalyticsChartSkeleton() {
  return (
    <Card hover={false}>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-2 h-48">
            <Skeleton className="h-full w-full max-h-[60%]" />
            <Skeleton className="h-full w-full max-h-[80%]" />
            <Skeleton className="h-full w-full max-h-[45%]" />
            <Skeleton className="h-full w-full max-h-[90%]" />
            <Skeleton className="h-full w-full max-h-[70%]" />
            <Skeleton className="h-full w-full max-h-[55%]" />
            <Skeleton className="h-full w-full max-h-[75%]" />
          </div>
          <div className="flex justify-center gap-4 pt-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
