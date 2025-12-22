import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AsyncComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AsyncComponent({ children, fallback }: AsyncComponentProps) {
  const defaultFallback = (
    <div className="w-full h-full min-h-[100px] rounded-lg">
      <Skeleton className="w-full h-full min-h-[100px]" />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}