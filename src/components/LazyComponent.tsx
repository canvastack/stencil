import React, { Suspense, useTransition } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyComponentProps {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  props?: any;
}

export function LazyComponent({ component: Component, props }: LazyComponentProps) {
  const [isPending, startTransition] = useTransition();
  
  return (
    <Suspense fallback={
      <div className="w-full h-full min-h-[100px] rounded-lg">
        <Skeleton className="w-full h-full min-h-[100px]" />
      </div>
    }>
      {React.createElement(Component, { ...props, startTransition, isPending })}
    </Suspense>
  );
}

export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyComponent = React.lazy(importFn);
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={
      <div className="w-full h-full min-h-[100px] rounded-lg">
        <Skeleton className="w-full h-full min-h-[100px]" />
      </div>
    }>
      <LazyComponent {...props} />
    </Suspense>
  );
}