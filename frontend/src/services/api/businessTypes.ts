import { tenantApiClient } from './tenantApiClient';

export interface BusinessType {
  value: string;
  label: string;
}

export interface BusinessTypesResponse {
  data: BusinessType[];
  existing: string[];
}

class BusinessTypesService {
  async getBusinessTypes(): Promise<BusinessTypesResponse> {
    try {
      const response = await tenantApiClient.get<BusinessTypesResponse>('/business-types');
      return response;
    } catch (error) {
      console.error('Failed to fetch business types:', error);
      return {
        data: [
          { value: 'metal_etching', label: 'Metal Etching' },
          { value: 'glass_etching', label: 'Glass Etching' },
          { value: 'award_plaque', label: 'Awards & Plaques' },
          { value: 'signage', label: 'Signage Solutions' },
          { value: 'industrial_etching', label: 'Industrial Etching' },
          { value: 'custom_etching', label: 'Custom Etching' },
        ],
        existing: []
      };
    }
  }
}

export const businessTypesService = new BusinessTypesService();
