import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { useGlobalContext } from '@/contexts/GlobalContext';

interface TenantScopedButtonProps extends ButtonProps {
  permission: string;
  tenantId?: string;
  hideWhenUnauthorized?: boolean;
  showTooltipWhenDisabled?: boolean;
}

export const TenantScopedButton: React.FC<TenantScopedButtonProps> = ({
  permission,
  tenantId,
  hideWhenUnauthorized = true,
  showTooltipWhenDisabled = false,
  children,
  'aria-label': ariaLabel,
  ...props
}) => {
  const { canAccess } = usePermissions();
  const { tenant } = useGlobalContext();

  const effectiveTenantId = tenantId || tenant?.uuid;
  const hasPermission = canAccess(permission);

  if (!hasPermission && hideWhenUnauthorized) {
    return null;
  }

  const enhancedAriaLabel = ariaLabel || `${children} (requires ${permission} permission)`;

  return (
    <Button
      {...props}
      disabled={!hasPermission || props.disabled}
      aria-label={enhancedAriaLabel}
      aria-disabled={!hasPermission || props.disabled}
      data-permission={permission}
      data-tenant-scoped="true"
      title={
        !hasPermission && showTooltipWhenDisabled
          ? `You don't have ${permission} permission`
          : props.title
      }
    >
      {children}
    </Button>
  );
};
