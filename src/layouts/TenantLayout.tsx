import { Outlet } from 'react-router-dom';
import { memo, useRef } from 'react';
import { TenantSidebar } from '@/components/tenant/TenantSidebar';
import { TenantHeader } from '@/components/tenant/TenantHeader';
import { TenantFooter } from '@/components/tenant/TenantFooter';
import { ScrollToTop } from '@/components/ScrollToTop';
import { useAdminStore } from '@/stores/adminStore';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useTenantAuth } from '@/hooks/useTenantAuth';
import { Navigate } from 'react-router-dom';
import { DebugErrorBoundary } from '@/components/DebugErrorBoundary';

// Development-only overflow debug helper
if (process.env.NODE_ENV === 'development') {
  import('@/lib/overflowDebug');
}

export const TenantLayout = memo(() => {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(`TenantLayout rendered #${renderCount.current}`);
  
  const { isAuthenticated, user, tenant } = useTenantAuth();
  const sidebarCollapsed = useAdminStore((state) => state.sidebarCollapsed);

  // More specific authentication check for tenant context
  if (!isAuthenticated || !user || !tenant) {
    console.log('TenantLayout: Not authenticated, redirecting to login', {
      isAuthenticated,
      hasUser: !!user,
      hasTenant: !!tenant
    });
    return <Navigate to="/login" replace />;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex bg-green-50/30 dark:bg-green-950/20">
        <DebugErrorBoundary componentName="TenantSidebar">
          <TenantSidebar />
        </DebugErrorBoundary>
        
        <div
          className={cn(
            'flex-1 flex flex-col transition-all duration-300',
            // Use padding-left instead of margin-left because the sidebar is position:fixed.
            sidebarCollapsed ? 'pl-20' : 'pl-64'
          )}
        >
          <DebugErrorBoundary componentName="TenantHeader">
            <TenantHeader />
          </DebugErrorBoundary>
          
          <div className="flex-1 overflow-x-hidden relative">
            <main 
              id="tenant-main-content"
              className="absolute inset-0 overflow-y-auto bg-background"
            >
              <div className="min-h-[calc(100vh-8rem)]">
                <DebugErrorBoundary componentName="LazyRoute-Outlet">
                  <Outlet />
                </DebugErrorBoundary>
              </div>
              <DebugErrorBoundary componentName="TenantFooter">
                <TenantFooter />
              </DebugErrorBoundary>
            </main>
          </div>
          
          <ScrollToTop />
        </div>
      </div>
    </TooltipProvider>
  );
});