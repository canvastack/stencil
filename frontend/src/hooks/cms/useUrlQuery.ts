import { useMutation } from '@tanstack/react-query';
import { urlService } from '@/services/cms/urlService';
import type {
  BuildUrlInput,
  PreviewUrlInput,
  BuiltUrl,
  ApiResponse,
} from '@/types/cms';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { TenantContextError, AuthError } from '@/lib/errors';

export const useBuildUrlMutation = () => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  return useMutation({
    mutationFn: async (input: BuildUrlInput): Promise<ApiResponse<BuiltUrl>> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }
      if (userType !== 'tenant') {
        throw new AuthError('Only tenant users can build URLs');
      }

      logger.debug('[CMS] Building URL', { input, tenantId: tenant.uuid });
      return await urlService.build(input);
    },
    onError: (error: any) => {
      toast.error('Failed to build URL', {
        description: error?.message || 'An error occurred while building the URL.',
      });
      logger.error('[CMS] Failed to build URL', { error: error.message });
    },
  });
};

export const usePreviewUrlMutation = () => {
  const { userType } = useGlobalContext();
  const { tenant, user } = useTenantAuth();

  return useMutation({
    mutationFn: async (input: PreviewUrlInput): Promise<ApiResponse<BuiltUrl>> => {
      if (!tenant?.uuid) {
        throw new TenantContextError('Tenant context not available');
      }
      if (!user?.id) {
        throw new AuthError('User not authenticated');
      }
      if (userType !== 'tenant') {
        throw new AuthError('Only tenant users can preview URLs');
      }

      logger.debug('[CMS] Previewing URL', { input, tenantId: tenant.uuid });
      return await urlService.preview(input);
    },
    onError: (error: any) => {
      toast.error('Failed to preview URL', {
        description: error?.message || 'An error occurred while previewing the URL.',
      });
      logger.error('[CMS] Failed to preview URL', { error: error.message });
    },
  });
};
