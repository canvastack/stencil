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

// Development-only overflow debug helper
if (process.env.NODE_ENV === 'development') {
  import('@/lib/overflowDebug');
}

export const TenantLayout = memo(() => {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(`TenantLayout rendered #${renderCount.current}`);
  
  const { isAuthenticated } = useTenantAuth();
  const sidebarCollapsed = useAdminStore((state) => state.sidebarCollapsed);

  // Redirect to tenant login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex bg-green-50/30 dark:bg-green-950/20">
        <TenantSidebar />
        
        <div
          className={cn(
            'flex-1 flex flex-col transition-all duration-300',
            // Use padding-left instead of margin-left because the sidebar is position:fixed.
            sidebarCollapsed ? 'pl-20' : 'pl-64'
          )}
        >
          <TenantHeader />
          
          <div className="flex-1 overflow-x-hidden relative">
            <main 
              id="tenant-main-content"
              className="absolute inset-0 overflow-y-auto bg-background"
            >
              <div className="min-h-[calc(100vh-8rem)]">
                <Outlet />
              </div>
              <TenantFooter />
            </main>
          </div>
          
          <ScrollToTop />
        </div>
      </div>
    </TooltipProvider>
  );
});