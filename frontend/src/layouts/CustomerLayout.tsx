import { Outlet } from 'react-router-dom';
import { memo, useRef } from 'react';
import { CustomerSidebar } from '@/components/customer-portal/CustomerSidebar';
import { CustomerHeader } from '@/components/customer-portal/CustomerHeader';
import { CustomerFooter } from '@/components/customer-portal/CustomerFooter';
import { ScrollToTop } from '@/components/ScrollToTop';
import { useAdminStore } from '@/stores/adminStore';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { Navigate } from 'react-router-dom';
import { DebugErrorBoundary } from '@/components/DebugErrorBoundary';

// Development-only overflow debug helper
if (process.env.NODE_ENV === 'development') {
  import('@/lib/overflowDebug');
}

export const CustomerLayout = memo(() => {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(`CustomerLayout rendered #${renderCount.current}`);
  
  const { isAuthenticated, customer, isLoading } = useCustomerAuth();
  const sidebarCollapsed = useAdminStore((state) => state.sidebarCollapsed);

  console.log('CustomerLayout: Auth state', {
    isAuthenticated,
    hasCustomer: !!customer,
    isLoading,
    renderCount: renderCount.current
  });

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('CustomerLayout: Not authenticated, redirecting to login');
    return <Navigate to="/customer/login" replace />;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex bg-blue-50/30 dark:bg-blue-950/20">
        <DebugErrorBoundary componentName="CustomerSidebar">
          <CustomerSidebar />
        </DebugErrorBoundary>
        
        <div
          className={cn(
            'flex-1 flex flex-col transition-all duration-300',
            // Use padding-left instead of margin-left because the sidebar is position:fixed.
            sidebarCollapsed ? 'pl-20' : 'pl-64'
          )}
        >
          <DebugErrorBoundary componentName="CustomerHeader">
            <CustomerHeader />
          </DebugErrorBoundary>
          
          <div className="flex-1 overflow-x-hidden relative">
            <main 
              id="customer-main-content"
              className="absolute inset-0 overflow-y-auto bg-background"
            >
              <div className="min-h-[calc(100vh-8rem)]">
                <DebugErrorBoundary componentName="LazyRoute-Outlet">
                  <Outlet />
                </DebugErrorBoundary>
              </div>
              <DebugErrorBoundary componentName="CustomerFooter">
                <CustomerFooter />
              </DebugErrorBoundary>
            </main>
          </div>
          
          <ScrollToTop />
        </div>
      </div>
    </TooltipProvider>
  );
});

CustomerLayout.displayName = 'CustomerLayout';
