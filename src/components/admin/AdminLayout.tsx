import { Outlet } from 'react-router-dom';
import { memo, useRef } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminFooter } from './AdminFooter';
import { ScrollToTop } from '@/components/ScrollToTop';
import { useAdminStore } from '@/stores/adminStore';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';

// Development-only overflow debug helper. Dynamically imported so it doesn't ship in production builds.
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  import('@/lib/overflowDebug');
}

export const AdminLayout = memo(() => {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(`AdminLayout rendered #${renderCount.current}`);
  const sidebarCollapsed = useAdminStore((state) => state.sidebarCollapsed);

  return (
    <TooltipProvider>
      <div className="min-h-screen flex">
        <AdminSidebar />
        
        <div
          className={cn(
            'flex-1 flex flex-col transition-all duration-300',
            // Use padding-left instead of margin-left because the sidebar is position:fixed.
            // Applying margin-left while the sidebar is fixed increases the total page width
            // (fixed element is out-of-flow), causing horizontal scroll on the root element.
            // Padding-left shifts the content without expanding layout width.
            sidebarCollapsed ? 'pl-20' : 'pl-64'
          )}
        >
          <AdminHeader />
          
          <div className="flex-1 overflow-x-hidden relative">
            <main 
              id="admin-main-content"
              className="absolute inset-0 overflow-y-auto bg-background"
            >
              <div className="min-h-[calc(100vh-8rem)]">
                <Outlet />
              </div>
              <AdminFooter />
            </main>
          </div>
          
          <ScrollToTop />
        </div>
      </div>
    </TooltipProvider>
  );
});
