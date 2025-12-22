import { Button } from '@/components/ui/button';
import { Moon, Sun, Menu, Search } from 'lucide-react';
import { useAdminStore } from '@/stores/adminStore';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { NotificationToast } from '@/components/ui/notification-toast';
import { usePageTracking } from '@/hooks/useActivity';

export const PlatformHeader = () => {
  const toggleSidebar = useAdminStore((state) => state.toggleSidebar);
  const [isDark, setIsDark] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Track page visits automatically
  usePageTracking();

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const handleScroll = () => {
      const mainContent = document.getElementById('platform-main-content');
      if (mainContent) {
        setIsScrolled(mainContent.scrollTop > 20);
      }
    };

    const mainContent = document.getElementById('platform-main-content');
    mainContent?.addEventListener('scroll', handleScroll);
    return () => mainContent?.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 transition-all duration-300',
        isScrolled
          ? 'bg-background/80 backdrop-blur-lg border-b shadow-lg'
          : 'bg-background/50 backdrop-blur-sm border-b border-border/50'
      )}
    >
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search Bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search platform..."
              className="pl-10 w-64 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <NotificationToast className="rounded-lg" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark(!isDark)}
            className="rounded-lg"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
};