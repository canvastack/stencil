import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { Building2, Store, ChevronDown, RefreshCw, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/api/auth';

interface ContextSwitcherProps {
  className?: string;
}

export const ContextSwitcher: React.FC<ContextSwitcherProps> = ({ className }) => {
  const { userType, tenant, platform, switchContext, clearContext, isLoading } = useGlobalContext();
  const platformAuth = usePlatformAuth();
  const tenantAuth = useTenantAuth();
  const navigate = useNavigate();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchToTenant = async () => {
    if (userType === 'tenant') return;
    
    setIsSwitching(true);
    try {
      // Check if we have existing tenant auth
      if (tenantAuth.isAuthenticated && tenantAuth.tenant && tenantAuth.user) {
        await switchContext('tenant', {
          user: tenantAuth.user,
          tenant: tenantAuth.tenant
        });
        navigate('/admin');
      } else {
        // Need to login as tenant
        navigate('/login');
      }
    } catch (error) {
      console.error('Failed to switch to tenant context:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSwitchToPlatform = async () => {
    if (userType === 'platform') return;
    
    setIsSwitching(true);
    try {
      // Check if we have existing platform auth
      if (platformAuth.isAuthenticated && platformAuth.account) {
        await switchContext('platform', {
          account: platformAuth.account
        });
        navigate('/platform');
      } else {
        // Need to login as platform
        navigate('/login');
      }
    } catch (error) {
      console.error('Failed to switch to platform context:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      clearContext();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getCurrentContextInfo = () => {
    switch (userType) {
      case 'platform':
        return {
          icon: <Building2 className="w-4 h-4" />,
          label: 'Platform Admin',
          subtitle: platform?.name || 'Platform Administration',
          color: 'blue'
        };
      case 'tenant':
        return {
          icon: <Store className="w-4 h-4" />,
          label: tenant?.name || 'Tenant Admin',
          subtitle: `Business Administration`,
          color: 'green'
        };
      case 'anonymous':
        return {
          icon: <Store className="w-4 h-4" />,
          label: 'Public Access',
          subtitle: 'Not authenticated',
          color: 'gray'
        };
    }
  };

  const contextInfo = getCurrentContextInfo();
  const showSwitcher = userType !== 'anonymous';

  if (!showSwitcher) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`h-auto p-2 hover:bg-muted/50 ${className}`}
          disabled={isLoading || isSwitching}
        >
          <div className="flex items-center gap-2">
            {isSwitching || isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              contextInfo.icon
            )}
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{contextInfo.label}</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1.5 py-0 h-4 ${
                    contextInfo.color === 'blue' ? 'border-blue-200 text-blue-700' :
                    contextInfo.color === 'green' ? 'border-green-200 text-green-700' :
                    'border-gray-200 text-gray-700'
                  }`}
                >
                  {userType}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {contextInfo.subtitle}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Context</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Platform Context Option */}
        <DropdownMenuItem 
          onClick={handleSwitchToPlatform}
          disabled={userType === 'platform' || isSwitching}
          className="flex items-center gap-2"
        >
          <Building2 className="w-4 h-4 text-blue-600" />
          <div className="flex flex-col">
            <span className="font-medium">Platform Administration</span>
            <span className="text-xs text-muted-foreground">
              System-wide management and settings
            </span>
          </div>
          {userType === 'platform' && (
            <Badge variant="secondary" className="text-xs ml-auto">Active</Badge>
          )}
        </DropdownMenuItem>

        {/* Tenant Context Option */}
        <DropdownMenuItem 
          onClick={handleSwitchToTenant}
          disabled={userType === 'tenant' || isSwitching}
          className="flex items-center gap-2"
        >
          <Store className="w-4 h-4 text-green-600" />
          <div className="flex flex-col">
            <span className="font-medium">
              {tenant?.name || 'Business Administration'}
            </span>
            <span className="text-xs text-muted-foreground">
              Manage your business operations
            </span>
          </div>
          {userType === 'tenant' && (
            <Badge variant="secondary" className="text-xs ml-auto">Active</Badge>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        {/* Logout Option */}
        <DropdownMenuItem 
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-600 hover:text-red-700"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ContextSwitcher;