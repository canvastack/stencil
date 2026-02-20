import { Button } from '@/components/ui/button';
import { Moon, Sun, Menu, Bell, User, LogOut, Settings } from 'lucide-react';
import { useAdminStore } from '@/stores/adminStore';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const CustomerHeader = () => {
  const toggleSidebar = useAdminStore((state) => state.toggleSidebar);
  const { customer, logout } = useCustomerAuth();
  
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;

    const stored = window.localStorage.getItem('stencil_color_mode');
    if (stored === 'light') return false;
    if (stored === 'dark') return true;

    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isScrolled, setIsScrolled] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      window.localStorage.setItem('stencil_color_mode', 'dark');
    } else {
      root.classList.remove('dark');
      window.localStorage.setItem('stencil_color_mode', 'light');
    }
  }, [isDark]);
  
  /* Scroll Tracking */
  useEffect(() => {
    const handleScroll = () => {
      const mainContent = document.getElementById('customer-main-content');
      if (mainContent) {
        setIsScrolled(mainContent.scrollTop > 20);
      }
    };

    const mainContent = document.getElementById('customer-main-content');
    mainContent?.addEventListener('scroll', handleScroll);
    return () => mainContent?.removeEventListener('scroll', handleScroll);
  }, []);

  // Get user initials
  const userInitials = customer?.name
    ?.split(' ')
    ?.map((n: string) => n?.[0] || '')
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'C';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 transition-all duration-300',
        isScrolled
          ? 'bg-background/80 backdrop-blur-lg border-b shadow-lg'
          : 'bg-background/50 backdrop-blur-sm border-b border-border/50'
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left Side */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="rounded-lg"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Customer Name - Hidden on mobile */}
          <div className="hidden md:block">
            <h2 className="font-semibold text-lg">{customer?.name}</h2>
            <p className="text-xs text-muted-foreground">Customer Portal</p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Notifications - Hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg relative hidden md:flex"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {/* Notification badge - example */}
            {/* <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              3
            </Badge> */}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark(!isDark)}
            className="rounded-lg"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={customer?.avatar} alt={customer?.name} />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{customer?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{customer?.email}</p>
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
