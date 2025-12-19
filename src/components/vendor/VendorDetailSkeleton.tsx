import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function VendorDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-24 w-24 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
      
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
