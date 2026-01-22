import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, Info } from 'lucide-react';

/**
 * NoAnalyticsEmptyState Component
 * 
 * Empty state untuk analytics dashboard ketika belum ada data analytics.
 * Menampilkan informasi bahwa analytics tracking perlu diaktifkan dan URL perlu diakses.
 * 
 * @component
 * @example
 * ```tsx
 * {!hasData && <NoAnalyticsEmptyState />}
 * ```
 * 
 * @returns {JSX.Element} Alert dengan empty state message
 */
export default function NoAnalyticsEmptyState() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription className="flex items-start gap-3">
        <BarChart3 className="h-12 w-12 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="font-semibold mb-1">No analytics data available yet</p>
          <p className="text-sm">
            Analytics data will appear here once your URLs are accessed by visitors.
            Make sure analytics tracking is enabled in your URL configuration.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
