import { Button } from '@/components/ui/button';
import { Moon, Sun, Menu, Search, User, LogOut, Settings } from 'lucide-react';
import { useAdminStore } from '@/stores/adminStore';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { NotificationToast } from '@/components/ui/notification-toast';
import { usePageTracking } from '@/hooks/useActivity';
import { useTenantAuth } from '@/hooks/useTenantAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const TenantHeader = () => {
  const toggleSidebar = useAdminStore((state) => state.toggleSidebar);
  const { user, tenant, logout } = useTenantAuth();
  // const [isDark, setIsDark] = useState(true);
  // const [isScrolled, setIsScrolled] = useState(false);
  
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;

    const stored = window.localStorage.getItem('stencil_color_mode');
    if (stored === 'light') return false;
    if (stored === 'dark') return true;

    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isScrolled, setIsScrolled] = useState(false);


  // Track page visits automatically
  usePageTracking();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  /*
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);
  */
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);
  
  /* Scroll Tracking */
  useEffect(() => {
    const handleScroll = () => {
      const mainContent = document.getElementById('admin-main-content');
      if (mainContent) {
        setIsScrolled(mainContent.scrollTop > 20);
      }
    };

    const mainContent = document.getElementById('admin-main-content');
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
              placeholder="Search..."
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

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-green-100 dark:bg-green-900">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {tenant?.name}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};