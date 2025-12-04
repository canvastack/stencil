import { anonymousApiClient } from './anonymousApiClient';
import { tenantApiClient } from './tenantApiClient';
import { platformApiClient } from './platformApiClient';

export { anonymousApiClient, tenantApiClient, platformApiClient };

// Helper function to get the appropriate client based on context
export const getContextAwareClient = (userType: 'anonymous' | 'platform' | 'tenant') => {
  switch (userType) {
    case 'anonymous':
      return anonymousApiClient;
    case 'platform':
      return platformApiClient;
    case 'tenant':
      return tenantApiClient;
    default:
      return anonymousApiClient;
  }
};