import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, Building, Info } from 'lucide-react';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { darkModeClasses } from '@/lib/utils/darkMode';
import { cn } from '@/lib/utils';

export const TenantIsolationBadge: React.FC = () => {
  const { tenant, userType } = useGlobalContext();

  if (userType === 'platform') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                'gap-2 cursor-help',
                'border-purple-300 bg-purple-50 text-purple-700',
                'dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300'
              )}
              aria-label="Platform Admin Mode - You have access to all tenants"
            >
              <Shield className="h-3 w-3" aria-hidden="true" />
              <span className="font-medium">Platform Admin Mode</span>
              <Info className="h-3 w-3" aria-hidden="true" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">You have access to all tenants</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!tenant) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={cn(
              'gap-2 cursor-help',
              darkModeClasses.bg.secondary,
              darkModeClasses.text.primary,
              darkModeClasses.border.default,
              'border'
            )}
            aria-label={`Tenant context: ${tenant.name}. Data is isolated to this tenant.`}
          >
            <Building className="h-3 w-3" aria-hidden="true" />
            <span className="font-medium">{tenant.name}</span>
            <Info className="h-3 w-3" aria-hidden="true" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Data is isolated to <strong>{tenant.name}</strong> tenant</p>
          <p className="text-xs text-muted-foreground mt-1">ID: {tenant.uuid?.slice(0, 8)}...</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
