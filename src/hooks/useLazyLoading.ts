import { useCallback, useTransition } from 'react';

/**
 * Hook to trigger preloading of lazy components/loaders as a transition.
 *
 * Usage:
 * 1) Pass a loader: loadComponent(() => import('./MyComp'))
 * 2) Pass a React.lazy component (best-effort): loadComponent(MyLazyComponent)
 */
export function useLazyLoading() {
  const [isPending, startTransition] = useTransition();

  const loadComponent = useCallback(
    (
      componentOrLoader: (() => Promise<any>) | React.LazyExoticComponent<any>
    ): Promise<any> => {
      let promise: Promise<any> | undefined;

      startTransition(() => {
        // If caller provided a loader function, call it to start fetching the module.
        if (typeof componentOrLoader === 'function') {
          try {
            promise = (componentOrLoader as () => Promise<any>)();
          } catch (err) {
            promise = Promise.reject(err);
          }
          return;
        }

        // Best-effort: try to access the internal loader on React.lazy objects.
        const lazyComp = componentOrLoader as React.LazyExoticComponent<any> & { _ctor?: () => Promise<any>; _payload?: any };
        // React internals vary by version; try common internal fields.
        const ctor = (lazyComp as any)._ctor || (lazyComp as any)._payload?._result || (lazyComp as any)._payload?._ctor;
        if (typeof ctor === 'function') {
          try {
            promise = ctor();
          } catch (err) {
            promise = Promise.reject(err);
          }
        } else {
          // Last resort: we cannot start preload for this lazy component in a portable way.
          // Return a resolved promise to keep the API consistent.
          // Caller can pass an explicit loader function to guarantee preloading.
          // eslint-disable-next-line no-console
          console.warn('useLazyLoading: unable to preload provided lazy component on this React version. Pass a loader function instead to guarantee preloading.');
          promise = Promise.resolve();
        }
      });

      return promise ?? Promise.resolve();
    },
    [startTransition]
  );

  return {
    isPending,
    loadComponent,
  };
}