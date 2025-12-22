import { Outlet } from 'react-router-dom';
import { memo, useRef } from 'react';
import { PlatformSidebar } from '@/components/platform/PlatformSidebar';
import { PlatformHeader } from '@/components/platform/PlatformHeader';
import { PlatformFooter } from '@/components/platform/PlatformFooter';
import { ScrollToTop } from '@/components/ScrollToTop';
import { useAdminStore } from '@/stores/adminStore';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { Navigate } from 'react-router-dom';

// Development-only overflow debug helper
if (process.env.NODE_ENV === 'development') {
  import('@/lib/overflowDebug');
}

export const PlatformLayout = memo(() => {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(`PlatformLayout rendered #${renderCount.current}`);
  
  const { isAuthenticated } = usePlatformAuth();
  const sidebarCollapsed = useAdminStore((state) => state.sidebarCollapsed);

  // Redirect to platform login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/platform/login" replace />;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex bg-blue-50/30 dark:bg-blue-950/20">
        <PlatformSidebar />
        
        <div
          className={cn(
            'flex-1 flex flex-col transition-all duration-300',
            // Use padding-left instead of margin-left because the sidebar is position:fixed.
            sidebarCollapsed ? 'pl-20' : 'pl-64'
          )}
        >
          <PlatformHeader />
          
          <div className="flex-1 overflow-x-hidden relative">
            <main 
              id="platform-main-content"
              className="absolute inset-0 overflow-y-auto bg-background"
            >
              <div className="min-h-[calc(100vh-8rem)]">
                <Outlet />
              </div>
              <PlatformFooter />
            </main>
          </div>
          
          <ScrollToTop />
        </div>
      </div>
    </TooltipProvider>
  );
});