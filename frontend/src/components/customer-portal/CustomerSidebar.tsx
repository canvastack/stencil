import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAdminStore } from '@/stores/adminStore';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Bell,
  Star,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface MenuItem {
  title: string;
  icon?: React.ElementType;
  path?: string;
  badge?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/customer/dashboard',
  },
  {
    title: 'My Quotes',
    icon: FileText,
    path: '/customer/quotes',
  },
  {
    title: 'Notifications',
    icon: Bell,
    path: '/customer/notifications',
  },
  {
    title: 'My Reviews',
    icon: Star,
    path: '/customer/reviews',
  },
  {
    title: 'Profile',
    icon: User,
    path: '/customer/profile',
  },
];

export const CustomerSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarCollapsed = useAdminStore((state) => state.sidebarCollapsed);
  const { customer, logout } = useCustomerAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Load expanded menus from localStorage on mount
  useEffect(() => {
    const savedExpandedMenus = localStorage.getItem('customer-sidebar-expanded-menus');
    if (savedExpandedMenus) {
      setExpandedMenus(JSON.parse(savedExpandedMenus));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/customer/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get current user info
  const userName = customer?.name || 'Customer';
  const userEmail = customer?.email || 'customer@example.com';
  const userInitials = userName?.split(' ')?.map(n => n?.[0] || '').filter(Boolean).join('').toUpperCase().slice(0, 2) || 'CU';

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) => {
      const newExpanded = prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title];
      
      // Save to localStorage
      localStorage.setItem('customer-sidebar-expanded-menus', JSON.stringify(newExpanded));
      return newExpanded;
    });
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isParentActive = (item: MenuItem): boolean => {
    if (item.path) return isActive(item.path);
    if (!item.children) return false;
    
    return item.children.some(child => {
      if (child.path && isActive(child.path)) return true;
      return isParentActive(child);
    });
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.title);
    const active = isParentActive(item);

    if (sidebarCollapsed) {
      return (
        <Tooltip key={item.title} delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'w-12 h-12 rounded-lg transition-all relative',
                active && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
              asChild={!hasChildren}
              onClick={hasChildren ? () => toggleMenu(item.title) : undefined}
            >
              {hasChildren ? (
                <div>
                  {item.icon && React.createElement(item.icon, { className: "w-5 h-5" })}
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              ) : (
                <Link to={item.path!} className="relative">
                  {item.icon && React.createElement(item.icon, { className: "w-5 h-5" })}
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.title}</p>
            {item.badge && (
              <p className="text-xs text-destructive">{item.badge} pending</p>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div key={item.title} className="space-y-1">
        {hasChildren ? (
          <>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-between rounded-lg transition-all',
                depth === 0 && '',
                depth === 1 && 'ml-4',
                depth === 2 && 'ml-8',
                active && 'bg-primary/10 text-primary'
              )}
              onClick={() => toggleMenu(item.title)}
            >
              <div className="flex items-center gap-3">
                {item.icon && React.createElement(item.icon, { className: "w-5 h-5" })}
                <span className="font-medium">{item.title}</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
            {isExpanded && (
              <div className="space-y-1">
                {item.children.map((child) => renderMenuItem(child, depth + 1))}
              </div>
            )}
          </>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-3 rounded-lg transition-all',
              depth === 0 && '',
              depth === 1 && 'ml-4',
              depth === 2 && 'ml-8',
              active && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            asChild
          >
            <Link to={item.path!} className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {item.icon && React.createElement(item.icon, { className: "w-5 h-5" })}
                <span className="font-medium">{item.title}</span>
              </div>
              {item.badge && (
                <Badge variant="destructive" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          </Button>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b px-4">
          {sidebarCollapsed ? (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">Customer Portal</h1>
                <p className="text-xs text-muted-foreground">Quote Management</p>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-elegant">
          {menuItems.map((item) => renderMenuItem(item, 0))}
        </nav>

        {/* User Profile */}
        <div className="border-t p-4">
          {sidebarCollapsed ? (
            <div className="space-y-2">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{userInitials}</span>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-12 h-12 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{userInitials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
