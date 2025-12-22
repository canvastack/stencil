import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingSkeleton = () => (
  <div className="w-full h-full min-h-[100px] rounded-lg">
    <Skeleton className="w-full h-full min-h-[100px]" />
  </div>
);

export function withSuspense<P extends object>(
  Component: React.ComponentType<P>,
) {
  return function WithSuspenseComponent(props: P) {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <Component {...props} />
      </Suspense>
    );
  };
}