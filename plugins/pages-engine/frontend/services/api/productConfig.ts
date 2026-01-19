import { getContextAwareClient, getContextAwareEndpoint, UserType } from './contextAwareClients';
import { ApiError } from '@/lib/errors';

export interface StatusOption {
  value: string;
  label: string;
  color?: string;
  description?: string;
}

export interface AvailabilityOption {
  value: string;
  label: string;
  icon?: string;
}

export interface ProductConfigResponse {
  statuses: StatusOption[];
  availabilities: AvailabilityOption[];
  currencies: Array<{ code: string; symbol: string; name: string }>;
  priceUnits: string[];
}

const MOCK_CONFIG: ProductConfigResponse = {
  statuses: [
    { value: 'draft', label: 'Draft', color: 'gray', description: 'Product is in draft mode' },
    { value: 'published', label: 'Published', color: 'green', description: 'Product is live and visible' },
    { value: 'archived', label: 'Archived', color: 'red', description: 'Product is archived' },
  ],
  availabilities: [
    { value: 'in-stock', label: 'In Stock', icon: 'check-circle' },
    { value: 'out-of-stock', label: 'Out of Stock', icon: 'x-circle' },
    { value: 'pre-order', label: 'Pre-order', icon: 'clock' },
  ],
  currencies: [
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
  ],
  priceUnits: ['pcs', 'unit', 'set', 'box', 'dozen', 'kg', 'm', 'm²'],
};

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const createProductConfigService = (userType: UserType) => {
  const apiClient = getContextAwareClient(userType);
  
  const handleError = (error: any, operation: string): never => {
    throw new ApiError(`Failed to ${operation}`, error);
  };
  
  return {
    async getProductConfig(signal?: AbortSignal): Promise<ProductConfigResponse> {
      if (USE_MOCK) {
        return new Promise((resolve) => {
          setTimeout(() => resolve(MOCK_CONFIG), 100);
        });
      }
      
      try {
        const endpoint = getContextAwareEndpoint(userType, 'products/config');
        const response = await apiClient.get<ProductConfigResponse>(endpoint, { signal });
        return response.data;
      } catch (error) {
        handleError(error, 'fetch product configuration');
      }
    },
    
    async getStatuses(signal?: AbortSignal): Promise<StatusOption[]> {
      if (USE_MOCK) {
        return new Promise((resolve) => {
          setTimeout(() => resolve(MOCK_CONFIG.statuses), 50);
        });
      }
      
      try {
        const endpoint = getContextAwareEndpoint(userType, 'products/statuses');
        const response = await apiClient.get<StatusOption[]>(endpoint, { signal });
        return response.data;
      } catch (error) {
        handleError(error, 'fetch product statuses');
      }
    },
    
    async getAvailabilities(signal?: AbortSignal): Promise<AvailabilityOption[]> {
      if (USE_MOCK) {
        return new Promise((resolve) => {
          setTimeout(() => resolve(MOCK_CONFIG.availabilities), 50);
        });
      }
      
      try {
        const endpoint = getContextAwareEndpoint(userType, 'products/availabilities');
        const response = await apiClient.get<AvailabilityOption[]>(endpoint, { signal });
        return response.data;
      } catch (error) {
        handleError(error, 'fetch product availabilities');
      }
    },
  };
};
