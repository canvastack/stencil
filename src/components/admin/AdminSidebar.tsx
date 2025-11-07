import { Link, useLocation } from 'react-router-dom';
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
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAdminStore } from '@/stores/adminStore';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from 'react';

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path?: string;
  badge?: string;
  children?: {
    title: string;
    path: string;
  }[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin',
  },
  {
    title: 'Content Management',
    icon: FileText,
    children: [
      { title: 'Home Page', path: '/admin/content/home' },
      { title: 'About Page', path: '/admin/content/about' },
      { title: 'Contact Page', path: '/admin/content/contact' },
      { title: 'FAQ Page', path: '/admin/content/faq' },
    ],
  },
  {
    title: 'Products',
    icon: Package,
    children: [
      { title: 'All Products', path: '/admin/products' },
      { title: 'Add Product', path: '/admin/products/new' },
      { title: 'Categories', path: '/admin/products/categories' },
    ],
  },
  {
    title: 'Reviews',
    icon: Star,
    path: '/admin/reviews',
    badge: '3',
  },
  {
    title: 'Media Library',
    icon: Image,
    path: '/admin/media',
  },
  {
    title: 'User Management',
    icon: Users,
    children: [
      { title: 'Users', path: '/admin/users' },
      { title: 'Roles', path: '/admin/roles' },
      { title: 'Customers', path: '/admin/customers' },
    ],
  },
  {
    title: 'Orders',
    icon: ShoppingCart,
    path: '/admin/orders',
  },
  {
    title: 'Vendors',
    icon: Building2,
    path: '/admin/vendors',
  },
  {
    title: 'Inventory',
    icon: PackageSearch,
    path: '/admin/inventory',
  },
  {
    title: 'Financial Report',
    icon: TrendingUp,
    path: '/admin/financial-report',
  },
  {
    title: 'Appearance',
    icon: Palette,
    children: [
      { title: '3D Manager', path: '/admin/3d-manager' },
      { title: 'Themes', path: '/admin/themes' },
    ],
  },
  {
    title: 'Language',
    icon: Globe,
    path: '/admin/language',
  },
  {
    title: 'Documentation',
    icon: BookOpen,
    path: '/admin/documentation',
  },
  {
    title: 'Settings',
    icon: Settings,
    path: '/admin/settings',
  },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const { sidebarCollapsed } = useAdminStore();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Content Management']);

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
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
                    <Link to={child.path}>{child.title}</Link>
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
          {menuItems.map(renderMenuItem)}
        </nav>

        {/* User Profile */}
        <div className="border-t p-4">
          {sidebarCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">AD</span>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Admin User</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">AD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">Admin User</p>
                <p className="text-xs text-muted-foreground truncate">admin@example.com</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
