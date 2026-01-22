import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * DomainCardSkeleton Component
 * 
 * Loading skeleton placeholder untuk domain card.
 * Digunakan selama data custom domains sedang di-fetch dari API.
 * 
 * @component
 * @example
 * ```tsx
 * {isLoading && <DomainCardSkeleton />}
 * ```
 * 
 * @returns {JSX.Element} Skeleton card dengan animated placeholders
 */
export default function DomainCardSkeleton() {
  return (
    <Card hover={false}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-36" />
        </div>
      </CardContent>
    </Card>
  );
}
