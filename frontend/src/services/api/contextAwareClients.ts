import { anonymousApiClient } from './anonymousApiClient';
import { tenantApiClient } from './tenantApiClient';
import { platformApiClient } from './platformApiClient';
import { TenantContextError } from '@/lib/errors';

export { anonymousApiClient, tenantApiClient, platformApiClient };

export type UserType = 'anonymous' | 'platform' | 'tenant';

export function getContextAwareClient(userType: UserType) {
  switch (userType) {
    case 'platform':
      return platformApiClient;
    case 'tenant':
      return tenantApiClient;
    case 'anonymous':
      return anonymousApiClient;
    default:
      throw new TenantContextError(`Invalid user type: ${userType}`);
  }
}

export function getContextAwareEndpoint(userType: UserType, resource: string): string {
  switch (userType) {
    case 'platform':
      return `/platform/${resource}`;
    case 'tenant':
      return `/${resource}`;
    case 'anonymous':
      return `/public/${resource}`;
    default:
      throw new TenantContextError(`Invalid user type for endpoint: ${userType}`);
  }
}