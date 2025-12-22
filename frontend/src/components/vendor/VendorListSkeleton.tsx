import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface VendorListSkeletonProps {
  count?: number;
}

export function VendorListSkeleton({ count = 5 }: VendorListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 flex-shrink-0" />
          </div>
        </Card>
      ))}
    </div>
  );
}
