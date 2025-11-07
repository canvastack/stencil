import React, { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

export function withLazyLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  LoadingComponent: React.ComponentType = () => (
    <div className="w-full h-full min-h-[100px] rounded-lg">
      <Skeleton className="w-full h-full min-h-[100px]" />
    </div>
  )
) {
  return function WithLazyLoadingComponent(props: P) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingComponent />}>
          <WrappedComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}