import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAdminStore } from '@/stores/adminStore';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Shield,
  Globe,
  Database,
  Activity,
  FileText,
  Wrench,
  Rocket,
  HelpCircle,
  DollarSign,
  Monitor,
  ChevronDown,
  ChevronRight,
  LogOut,
  Edit3
} from 'lucide-react';

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path?: string;
  children?: {
    title: string;
    path: string;
  }[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Tenant Management',
    icon: Building2,
    children: [
      { title: 'Tenant Directory', path: '/platform/tenants/directory' },
      { title: 'Tenant Onboarding', path: '/platform/tenants/onboarding' },
      { title: 'Tenant Health Monitoring', path: '/platform/tenants/health' },
      { title: 'Tenant Data Isolation Audit', path: '/platform/tenants/audit' },
      { title: 'Tenant Deactivation/Migration', path: '/platform/tenants/migration' }
    ]
  },
  {
    title: 'License Management',
    icon: Shield,
    children: [
      { title: 'License Packages', path: '/platform/licenses/packages' },
      { title: 'Feature Toggles', path: '/platform/licenses/features' },
      { title: 'License Assignments', path: '/platform/licenses/assignments' },
      { title: 'Usage Tracking', path: '/platform/licenses/usage' },
      { title: 'License Renewals', path: '/platform/licenses/renewals' }
    ]
  },
  {
    title: 'Billing & Pricing',
    icon: DollarSign,
    children: [
      { title: 'Pricing Models', path: '/platform/billing/pricing' },
      { title: 'Subscription Management', path: '/platform/billing/subscriptions' },
      { title: 'Invoice Generation', path: '/platform/billing/invoices' },
      { title: 'Payment Processing', path: '/platform/billing/payments' },
      { title: 'Revenue Analytics', path: '/platform/billing/analytics' }
    ]
  },
  {
    title: 'Service Management',
    icon: Wrench,
    children: [
      { title: 'Platform Services', path: '/platform/services/platform' },
      { title: 'Service Level Agreements', path: '/platform/services/sla' },
      { title: 'Service Health Monitoring', path: '/platform/services/health' },
      { title: 'Maintenance Scheduling', path: '/platform/services/maintenance' },
      { title: 'Service Documentation', path: '/platform/services/docs' }
    ]
  },
  {
    title: 'Platform Analytics',
    icon: BarChart3,
    children: [
      { title: 'Multi-Tenant Usage Metrics', path: '/platform/analytics/usage' },
      { title: 'Performance Dashboards', path: '/platform/analytics/performance' },
      { title: 'Resource Utilization', path: '/platform/analytics/resources' },
      { title: 'Growth Analytics', path: '/platform/analytics/growth' },
      { title: 'Business Intelligence', path: '/platform/analytics/bi' }
    ]
  },
  {
    title: 'System Administration',
    icon: Database,
    children: [
      { title: 'Platform Configuration', path: '/platform/system/config' },
      { title: 'Database Management', path: '/platform/system/database' },
      { title: 'Security Policies', path: '/platform/system/security' },
      { title: 'Backup & Recovery', path: '/platform/system/backup' },
      { title: 'System Logs', path: '/platform/system/logs' }
    ]
  },
  {
    title: 'Feature Management',
    icon: Rocket,
    children: [
      { title: 'Feature Rollouts', path: '/platform/features/rollouts' },
      { title: 'A/B Testing', path: '/platform/features/ab-testing' },
      { title: 'Feature Usage Analytics', path: '/platform/features/analytics' },
      { title: 'Feedback Management', path: '/platform/features/feedback' }
    ]
  },
  {
    title: 'Content Management',
    icon: Edit3,
    children: [
      { title: 'Home Page', path: '/platform/content/home' },
      { title: 'About Page', path: '/platform/content/about' },
      { title: 'Contact Page', path: '/platform/content/contact' },
      { title: 'FAQ Page', path: '/platform/content/faq' }
    ]
  },
  {
    title: 'Support & Help',
    icon: HelpCircle,
    children: [
      { title: 'Tenant Support Tickets', path: '/platform/support/tickets' },
      { title: 'Knowledge Base Management', path: '/platform/support/kb' },
      { title: 'Support Analytics', path: '/platform/support/analytics' },
      { title: 'Documentation Management', path: '/platform/support/docs' }
    ]
  }
];

export const PlatformSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarCollapsed = useAdminStore((state) => state.sidebarCollapsed);
  const { account, logout } = usePlatformAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Load expanded menus from localStorage on mount
  useEffect(() => {
    const savedExpandedMenus = localStorage.getItem('platform-sidebar-expanded-menus');
    if (savedExpandedMenus) {
      setExpandedMenus(JSON.parse(savedExpandedMenus));
    } else {
      // Default expanded menus
      setExpandedMenus(['Tenant Management']);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/platform/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get current user info
  const userName = account?.name || 'Platform Admin';
  const userEmail = account?.email || 'admin@platform.com';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) => {
      const newExpanded = prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title];
      
      // Save to localStorage
      localStorage.setItem('platform-sidebar-expanded-menus', JSON.stringify(newExpanded));
      return newExpanded;
    });
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">Platform</h1>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
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
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
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
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
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