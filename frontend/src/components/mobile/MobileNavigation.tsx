import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  ShoppingCart, 
  Users, 
  UserCheck, 
  BarChart3,
  Package,
  Settings,
  Brain,
  Factory
} from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { path: '/admin', icon: Home, label: 'Dashboard' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/admin/vendors', icon: Users, label: 'Vendors' },
  { path: '/admin/customers', icon: UserCheck, label: 'Customers' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' }
];

const secondaryNavItems: NavItem[] = [
  { path: '/admin/products', icon: Package, label: 'Products' },
  { path: '/admin/production', icon: Factory, label: 'Production' },
  { path: '/admin/ai-dashboard', icon: Brain, label: 'AI Insights' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' }
];

export function MobileNavigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Primary Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden safe-area-pb">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full transition-colors relative",
                  "min-w-0 px-1 py-2 rounded-lg mx-1",
                  active 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5 mb-1" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium truncate w-full text-center">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Secondary Navigation Drawer Trigger */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <MobileSecondaryNav items={secondaryNavItems} />
      </div>
    </>
  );
}

interface MobileSecondaryNavProps {
  items: NavItem[];
}

function MobileSecondaryNav({ items }: MobileSecondaryNavProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="relative">
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Secondary Nav Items */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-background border border-border rounded-lg shadow-lg p-2 z-20 min-w-[200px]">
          <div className="space-y-1">
            {items.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    active 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg",
          "flex items-center justify-center transition-transform",
          "hover:scale-105 active:scale-95",
          isOpen && "rotate-45"
        )}
      >
        <div className="relative">
          <div className="w-4 h-0.5 bg-current absolute top-0 left-0" />
          <div className="w-0.5 h-4 bg-current absolute top-0 left-1.5" />
        </div>
      </button>
    </div>
  );
}

// Hook for mobile navigation state
export function useMobileNavigation() {
  const [isBottomNavVisible, setIsBottomNavVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide nav when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsBottomNavVisible(false);
      } else {
        setIsBottomNavVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return {
    isBottomNavVisible,
    setIsBottomNavVisible
  };
}