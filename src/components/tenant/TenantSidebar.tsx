import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAdminStore } from '@/stores/adminStore';
import { useTenantAuth } from '@/hooks/useTenantAuth';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  CreditCard,
  Star,
  BarChart3,
  Settings,
  Store,
  FileText,
  Palette,
  Images,
  Building,
  Warehouse,
  ChevronDown,
  ChevronRight,
  LogOut,
  FileText as Quote,
  Factory,
  Shield
} from 'lucide-react';

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path?: string;
  children?: {
    title: string;
    path: string;
  }[];
  requiredRoles?: string[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin',
  },
  {
    title: 'Products',
    icon: Package,
    children: [
      { title: 'Product Catalog', path: '/admin/products/catalog' },
      { title: 'Product Categories', path: '/admin/products/categories' },
      { title: 'Bulk Import/Export', path: '/admin/products/bulk' },
      { title: 'Product Analytics', path: '/admin/products/analytics' }
    ]
  },
  {
    title: 'Vendors',
    icon: Building,
    children: [
      { title: 'Vendor Directory', path: '/admin/vendors/directory' },
      { title: 'Vendor Performance', path: '/admin/vendors/performance' },
      { title: 'Contracts & Terms', path: '/admin/vendors/contracts' },
      { title: 'Vendor Communications', path: '/admin/vendors/communications' }
    ]
  },
  {
    title: 'Customers',
    icon: Users,
    children: [
      { title: 'Customer Database', path: '/admin/customers/database' },
      { title: 'Customer Segments', path: '/admin/customers/segments' },
      { title: 'Credit Management', path: '/admin/customers/credit' },
      { title: 'Customer Portal Access', path: '/admin/customers/portal' }
    ]
  },
  {
    title: 'Quotes',
    icon: Quote,
    path: '/admin/quotes',
  },
  {
    title: 'Invoices',
    icon: FileText,
    path: '/admin/invoices',
  },
  {
    title: 'Payments',
    icon: CreditCard,
    children: [
      { title: 'Payment Overview', path: '/admin/payments' },
      { title: 'Payment Verification', path: '/admin/payments/verification' },
      { title: 'Refunds & Disputes', path: '/admin/payments/refunds' },
      { title: 'Payment Reports', path: '/admin/payments/reports' }
    ]
  },
  {
    title: 'Production',
    icon: Factory,
    children: [
      { title: 'Production Overview', path: '/admin/production' },
      { title: 'Production Schedule', path: '/admin/production/schedule' },
      { title: 'Production Reports', path: '/admin/production/reports' }
    ]
  },
  {
    title: 'Quality Control',
    icon: Shield,
    children: [
      { title: 'Quality Overview', path: '/admin/quality' },
      { title: 'Inspections', path: '/admin/quality/inspections' },
      { title: 'Defect Analysis', path: '/admin/quality/defects' },
      { title: 'Quality Reports', path: '/admin/quality/reports' }
    ]
  },
  {
    title: 'Orders',
    icon: ShoppingCart,
    children: [
      { title: 'Order Management', path: '/admin/orders/management' },
      { title: 'Order Tracking', path: '/admin/orders/tracking' },
      { title: 'Bulk Orders', path: '/admin/orders/bulk' },
      { title: 'Order Analytics', path: '/admin/orders/analytics' }
    ]
  },
  {
    title: 'Inventory',
    icon: Warehouse,
    children: [
      { title: 'Stock Management', path: '/admin/inventory/stock' },
      { title: 'Warehouse Locations', path: '/admin/inventory/locations' },
      { title: 'Stock Alerts', path: '/admin/inventory/alerts' },
      { title: 'Inventory Reports', path: '/admin/inventory/reports' }
    ]
  },
  {
    title: 'Shipping',
    icon: Truck,
    children: [
      { title: 'Shipping Methods', path: '/admin/shipping/methods' },
      { title: 'Carrier Management', path: '/admin/shipping/carriers' },
      { title: 'Tracking Integration', path: '/admin/shipping/tracking' },
      { title: 'Delivery Reports', path: '/admin/shipping/reports' }
    ]
  },
  {
    title: 'Reviews',
    icon: Star,
    children: [
      { title: 'Customer Reviews', path: '/admin/reviews/customer' },
      { title: 'Vendor Feedback', path: '/admin/reviews/vendor' },
      { title: 'Rating Management', path: '/admin/reviews/rating' },
      { title: 'Review Analytics', path: '/admin/reviews/analytics' }
    ]
  },
  {
    title: 'Reports',
    icon: BarChart3,
    children: [
      { title: 'Sales Reports', path: '/admin/reports/sales' },
      { title: 'Performance Metrics', path: '/admin/reports/performance' },
      { title: 'Financial Statements', path: '/admin/reports/financial' },
      { title: 'Business Intelligence', path: '/admin/reports/bi' }
    ]
  }
];

export const TenantSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarCollapsed = useAdminStore((state) => state.sidebarCollapsed);
  const { tenant, user, roles, logout } = useTenantAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Load expanded menus from localStorage on mount
  useEffect(() => {
    const savedExpandedMenus = localStorage.getItem('tenant-sidebar-expanded-menus');
    if (savedExpandedMenus) {
      setExpandedMenus(JSON.parse(savedExpandedMenus));
    } else {
      // Default expanded menus
      setExpandedMenus(['Products']);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get current user info
  const userName = user?.name || 'Tenant User';
  const userEmail = user?.email || 'user@tenant.com';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) => {
      const newExpanded = prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title];
      
      // Save to localStorage
      localStorage.setItem('tenant-sidebar-expanded-menus', JSON.stringify(newExpanded));
      return newExpanded;
    });
  };

  // Check if user has permission to access certain items
  const hasPermission = (item: MenuItem) => {
    if (!item.requiredRoles) return true;
    return item.requiredRoles.some((role) => roles.includes(role));
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isParentActive = (item: MenuItem) => {
    if (item.path) return isActive(item.path);
    return item.children?.some(child => isActive(child.path));
  };

  const renderMenuItem = (item: MenuItem) => {
    if (!hasPermission(item)) return null;

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
                'w-12 h-12 rounded-lg transition-all',
                active && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
              asChild={!hasChildren}
              onClick={hasChildren ? () => toggleMenu(item.title) : undefined}
            >
              {hasChildren ? (
                <div>
                  <item.icon className="w-5 h-5" />
                </div>
              ) : (
                <Link to={item.path!}>
                  <item.icon className="w-5 h-5" />
                </Link>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.title}</p>
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
                active && 'bg-primary/10 text-primary'
              )}
              onClick={() => toggleMenu(item.title)}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.title}</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
            {isExpanded && (
              <div className="ml-8 space-y-1">
                {item.children.map((child) => (
                  <Button
                    key={child.path}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'w-full justify-start rounded-lg',
                      isActive(child.path) && 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                    asChild
                  >
                    <Link to={child.path}>
                      <span>{child.title}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            )}
          </>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-3 rounded-lg transition-all',
              active && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            asChild
          >
            <Link to={item.path!}>
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.title}</span>
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
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">Tenant Panel</h1>
                <p className="text-xs text-muted-foreground">Business Management</p>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-elegant">
          {menuItems.map(renderMenuItem)}
        </nav>

        {/* User Profile */}
        <div className="border-t p-4">
          {sidebarCollapsed ? (
            <div className="space-y-2">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
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
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
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