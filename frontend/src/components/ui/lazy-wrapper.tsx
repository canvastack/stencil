import React, { Suspense, useEffect, useState, useTransition } from 'react';
import { Skeleton } from './skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface LazyWrapperProps {
  children: React.ReactNode;
}

export function LazyWrapper({ children }: LazyWrapperProps) {
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    });
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[100px] rounded-lg">
        <Skeleton className="w-full h-full min-h-[100px]" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="w-full h-full min-h-[100px] rounded-lg">
            <Skeleton className="w-full h-full min-h-[100px]" />
          </div>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}