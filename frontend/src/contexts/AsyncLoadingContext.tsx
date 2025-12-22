import React, { createContext, useContext, useTransition, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AsyncLoadingContextType {
  startAsyncLoad: () => void;
  isPending: boolean;
}

const AsyncLoadingContext = createContext<AsyncLoadingContextType>({
  startAsyncLoad: () => {},
  isPending: false
});

interface AsyncLoadingProviderProps {
  children: React.ReactNode;
}

const LoadingFallback = () => (
  <div className="w-full h-full min-h-[100px] rounded-lg">
    <Skeleton className="w-full h-full min-h-[100px]" />
  </div>
);

export function AsyncLoadingProvider({ children }: AsyncLoadingProviderProps) {
  const [isPending, startTransition] = useTransition();

  const startAsyncLoad = () => {
    startTransition(() => {});
  };

  const value = {
    startAsyncLoad,
    isPending
  };

  return (
    <AsyncLoadingContext.Provider value={value}>
      <Suspense fallback={<LoadingFallback />}>
        {children}
      </Suspense>
    </AsyncLoadingContext.Provider>
  );
}

export const useAsyncLoading = () => {
  const context = useContext(AsyncLoadingContext);
  if (!context) {
    throw new Error('useAsyncLoading must be used within an AsyncLoadingProvider');
  }
  return context;
};