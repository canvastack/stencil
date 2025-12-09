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
  const WithLazyLoadingComponent = React.forwardRef<any, P>((props, ref) => {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingComponent />}>
          <WrappedComponent {...props} ref={ref} />
        </Suspense>
      </ErrorBoundary>
    );
  });

  WithLazyLoadingComponent.displayName = `WithLazyLoading(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithLazyLoadingComponent;
}