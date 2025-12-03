import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Palette, 
  FileText, 
  Package, 
  Star,
  Image,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Building2,
  ShoppingCart,
  PackageSearch,
  TrendingUp,
  Globe,
  BarChart3,
  Zap,
  LogOut,
  Activity,
  Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAdminStore } from '@/stores/adminStore';
import { useAuthState } from '@/hooks/useAuthState';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from 'react';

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path?: string;
  badge?: string;
  children?: {
    title: string;
    path: string;
    badge?: string;
    requiredRoles?: string[];
  }[];
  visibleFor?: 'platform' | 'tenant' | 'both';
  requiredRoles?: string[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin',
    visibleFor: 'both',
  },
  {
    title: 'Tenants',
    icon: Building2,
    path: '/admin/tenants',
    visibleFor: 'platform',
  },
  {
    title: 'Subscriptions',
    icon: Zap,
    path: '/admin/subscriptions',
    visibleFor: 'platform',
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    path: '/admin/analytics',
    visibleFor: 'platform',
  },
  {
    title: 'Content Management',
    icon: FileText,
    visibleFor: 'tenant',
    children: [
      { title: 'Home Page', path: '/admin/pages/home' },
      { title: 'About Page', path: '/admin/pages/about' },
      { title: 'Contact Page', path: '/admin/pages/contact' },
      { title: 'FAQ Page', path: '/admin/pages/faq' },
    ],
  },
  {
    title: 'Commerce Management',
    icon: Store,
    visibleFor: 'tenant',
    children: [
      { title: 'All Products', path: '/admin/products', requiredRoles: ['admin', 'manager'] },
      { title: 'Add Product', path: '/admin/products/new', requiredRoles: ['admin', 'manager'] },
      { title: 'Categories', path: '/admin/products/categories', requiredRoles: ['admin', 'manager'] },
      { title: 'Orders', path: '/admin/orders' },
      { title: 'Quotes', path: '/admin/quotes', requiredRoles: ['admin', 'manager'] },
      { title: 'Payments', path: '/admin/payments', requiredRoles: ['admin', 'manager'] },
      { title: 'Shipping', path: '/admin/shipping', requiredRoles: ['admin', 'manager'] },
      { title: 'Reviews', path: '/admin/reviews', badge: '3' },
      { title: 'Vendors', path: '/admin/vendors', requiredRoles: ['admin', 'manager'] },
      { title: 'Inventory', path: '/admin/inventory', requiredRoles: ['admin', 'manager'] },
    ],
  },
  {
    title: 'Customers',
    icon: Users,
    path: '/admin/customers',
    visibleFor: 'tenant',
  },
  {
    title: 'Financial Report',
    icon: TrendingUp,
    path: '/admin/financial-report',
    visibleFor: 'tenant',
    requiredRoles: ['admin', 'manager'],
  },
  {
    title: 'Appearance',
    icon: Palette,
    visibleFor: 'tenant',
    requiredRoles: ['admin', 'manager'],
    children: [
      { title: '3D Manager', path: '/admin/3d-manager' },
      { title: 'Themes', path: '/admin/themes' },
    ],
  },
  {
    title: 'User Management',
    icon: Users,
    visibleFor: 'tenant',
    requiredRoles: ['admin', 'manager'],
    children: [
      { title: 'Users', path: '/admin/users' },
      { title: 'Roles', path: '/admin/roles' },
    ],
  },
  {
    title: 'Language',
    icon: Globe,
    path: '/admin/language',
    visibleFor: 'tenant',
    requiredRoles: ['admin', 'manager'],
  },
  {
    title: 'Media Library',
    icon: Image,
    path: '/admin/media',
    visibleFor: 'tenant',
    requiredRoles: ['admin', 'manager'],
  },
  {
    title: 'Documentation',
    icon: BookOpen,
    path: '/admin/documentation',
    visibleFor: 'tenant',
  },
  {
    title: 'Activity Log',
    icon: Activity,
    path: '/admin/activity-log',
    visibleFor: 'tenant',
    requiredRoles: ['admin', 'manager'],
  },
  {
    title: 'Performance',
    icon: Zap,
    path: '/admin/performance',
    visibleFor: 'tenant',
    requiredRoles: ['admin', 'manager'],
  },
  {
    title: 'Settings',
    icon: Settings,
    path: '/admin/settings',
    visibleFor: 'tenant',
    requiredRoles: ['admin', 'manager'],
  },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarCollapsed = useAdminStore((state) => state.sidebarCollapsed);
  const { accountType, roles, user, account, logout } = useAuthState();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Load expanded menus from localStorage on mount
  useEffect(() => {
    const savedExpandedMenus = localStorage.getItem('admin-sidebar-expanded-menus');
    if (savedExpandedMenus) {
      setExpandedMenus(JSON.parse(savedExpandedMenus));
    } else {
      // Default expanded menus
      setExpandedMenus(['Content Management', 'Commerce Management']);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get current user info based on account type
  const currentUser = accountType === 'platform' ? account : user;
  const userName = currentUser?.name || 'Unknown User';
  const userEmail = currentUser?.email || 'unknown@email.com';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) => {
      const newExpanded = prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title];
      
      // Save to localStorage
      localStorage.setItem('admin-sidebar-expanded-menus', JSON.stringify(newExpanded));
      return newExpanded;
    });
  };

  const isMenuItemVisible = (item: MenuItem): boolean => {
    if (!item.visibleFor) return true;
    
    if (item.visibleFor === 'both') return true;
    if (item.visibleFor === 'platform' && accountType === 'platform') return true;
    if (item.visibleFor === 'tenant' && accountType === 'tenant') {
      if (!item.requiredRoles) return true;
      return item.requiredRoles.some((role) => roles.includes(role));
    }
    
    return false;
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
                  {item.badge && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                  )}
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
                {item.children
                  .filter((child) => {
                    if (!child.requiredRoles) return true;
                    return child.requiredRoles.some((role) => roles.includes(role));
                  })
                  .map((child) => (
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
                      <span className="flex items-center justify-between w-full">
                        {child.title}
                        {child.badge && (
                          <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                            {child.badge}
                          </span>
                        )}
                      </span>
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
              {item.badge && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
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
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">CMS Management</p>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-elegant">
          {menuItems.filter(isMenuItemVisible).map(renderMenuItem)}
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
