import { Outlet } from 'react-router-dom';
import { memo, useRef } from 'react';
import { VendorSidebar } from '@/components/vendor/VendorSidebar';
import { VendorHeader } from '@/components/vendor/VendorHeader';
import { VendorFooter } from '@/components/vendor/VendorFooter';
import { ScrollToTop } from '@/components/ScrollToTop';
import { useAdminStore } from '@/stores/adminStore';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useVendorAuth } from '@/contexts/VendorAuthContext';
import { Navigate } from 'react-router-dom';
import { DebugErrorBoundary } from '@/components/DebugErrorBoundary';

// Development-only overflow debug helper
if (process.env.NODE_ENV === 'development') {
  import('@/lib/overflowDebug');
}

export const VendorLayout = memo(() => {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(`VendorLayout rendered #${renderCount.current}`);
  
  const { isAuthenticated, user, vendor } = useVendorAuth();
  const sidebarCollapsed = useAdminStore((state) => state.sidebarCollapsed);

  // More specific authentication check for vendor context
  if (!isAuthenticated || !user || !vendor) {
    console.log('VendorLayout: Not authenticated, redirecting to login', {
      isAuthenticated,
      hasUser: !!user,
      hasVendor: !!vendor
    });
    return <Navigate to="/vendor/login" replace />;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex bg-purple-50/30 dark:bg-purple-950/20">
        <DebugErrorBoundary componentName="VendorSidebar">
          <VendorSidebar />
        </DebugErrorBoundary>
        
        <div
          className={cn(
            'flex-1 flex flex-col transition-all duration-300',
            // Use padding-left instead of margin-left because the sidebar is position:fixed.
            sidebarCollapsed ? 'pl-20' : 'pl-64'
          )}
        >
          <DebugErrorBoundary componentName="VendorHeader">
            <VendorHeader />
          </DebugErrorBoundary>
          
          <div className="flex-1 overflow-x-hidden relative">
            <main 
              id="vendor-main-content"
              className="absolute inset-0 overflow-y-auto bg-background"
            >
              <div className="min-h-[calc(100vh-8rem)]">
                <DebugErrorBoundary componentName="LazyRoute-Outlet">
                  <Outlet />
                </DebugErrorBoundary>
              </div>
              <DebugErrorBoundary componentName="VendorFooter">
                <VendorFooter />
              </DebugErrorBoundary>
            </main>
          </div>
          
          <ScrollToTop />
        </div>
      </div>
    </TooltipProvider>
  );
});

VendorLayout.displayName = 'VendorLayout';
