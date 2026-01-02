import { tenantApiClient } from './tenantApiClient';
import { anonymousApiClient } from '../api/anonymousApiClient';
import type {
  HeaderConfig,
  HeaderConfigInput,
  HeaderConfigResponse,
  Menu,
  MenuInput,
  MenusQueryParams,
  MenusResponse,
  SingleMenuResponse,
  MenuReorderInput,
  FooterConfig,
  FooterConfigInput,
  FooterConfigResponse,
  ApiError
} from '../../types/navigation';

const NAVIGATION_BASE = '/content/navigation';

export const navigationService = {
  async getHeaderConfig(): Promise<HeaderConfig> {
    console.log('[navigationService] 🔄 Calling header API...');
    const response = await tenantApiClient.get<HeaderConfigResponse>(`${NAVIGATION_BASE}/header`);
    console.log('[navigationService] 📦 Raw response:', response);
    console.log('[navigationService] 📦 response.data:', response.data);
    console.log('[navigationService] 📦 response.data.data:', (response as any).data?.data);
    
    // The tenantApiClient interceptor unwraps axios response, so response is already the API data
    // Check if we need to unwrap further
    if (response && typeof response === 'object' && 'data' in response) {
      console.log('[navigationService] ✅ Returning response.data');
      return (response as any).data;
    }
    
    console.log('[navigationService] ✅ Returning response directly');
    return response.data.data;
  },

  async createHeaderConfig(data: HeaderConfigInput): Promise<HeaderConfig> {
    const response = await tenantApiClient.post<HeaderConfigResponse>(`${NAVIGATION_BASE}/header`, data);
    return response.data.data;
  },

  async updateHeaderConfig(data: HeaderConfigInput): Promise<HeaderConfig> {
    const response = await tenantApiClient.put<HeaderConfigResponse>(`${NAVIGATION_BASE}/header`, data);
    return response.data.data;
  },

  async getMenus(params?: MenusQueryParams): Promise<MenusResponse> {
    console.log('📡 [navigationService] Calling API with params:', params);
    const response = await tenantApiClient.get<MenusResponse>(`${NAVIGATION_BASE}/menus`, { params });
    console.log('📡 [navigationService] API response:', response);
    console.log('📡 [navigationService] response.data:', response.data);
    console.log('📡 [navigationService] response.data type:', typeof response.data);
    console.log('📡 [navigationService] response.data is Array?:', Array.isArray(response.data));
    return response;
  },

  async getMenu(uuid: string): Promise<Menu> {
    const response = await tenantApiClient.get<SingleMenuResponse>(`${NAVIGATION_BASE}/menus/${uuid}`);
    return response.data.data;
  },

  async createMenu(data: MenuInput): Promise<Menu> {
    const response = await tenantApiClient.post<SingleMenuResponse>(`${NAVIGATION_BASE}/menus`, data);
    return response.data.data;
  },

  async updateMenu(uuid: string, data: MenuInput): Promise<Menu> {
    const response = await tenantApiClient.put<SingleMenuResponse>(`${NAVIGATION_BASE}/menus/${uuid}`, data);
    return response.data.data;
  },

  async deleteMenu(uuid: string): Promise<void> {
    await tenantApiClient.delete(`${NAVIGATION_BASE}/menus/${uuid}`);
  },

  async reorderMenus(menus: MenuReorderInput[]): Promise<void> {
    await tenantApiClient.post(`${NAVIGATION_BASE}/menus/reorder`, { menus });
  },

  async restoreMenu(uuid: string): Promise<Menu> {
    const response = await tenantApiClient.post<SingleMenuResponse>(`${NAVIGATION_BASE}/menus/${uuid}/restore`);
    return response.data.data;
  },

  async getFooterConfig(): Promise<FooterConfig> {
    console.log('[navigationService] 🔄 Calling footer API...');
    const response = await tenantApiClient.get<FooterConfigResponse>(`${NAVIGATION_BASE}/footer`);
    console.log('[navigationService] 📦 Footer raw response:', response);
    
    if (response && typeof response === 'object' && 'data' in response) {
      console.log('[navigationService] ✅ Returning response.data for footer');
      return (response as any).data;
    }
    
    console.log('[navigationService] ✅ Returning response directly for footer');
    return response.data.data;
  },

  async createFooterConfig(data: FooterConfigInput): Promise<FooterConfig> {
    const response = await tenantApiClient.post<FooterConfigResponse>(`${NAVIGATION_BASE}/footer`, data);
    
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data;
    }
    return response.data.data;
  },

  async updateFooterConfig(data: FooterConfigInput): Promise<FooterConfig> {
    const response = await tenantApiClient.put<FooterConfigResponse>(`${NAVIGATION_BASE}/footer`, data);
    
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data;
    }
    return response.data.data;
  },
};

export const publicNavigationService = {
  async getHeader(tenantSlug: string): Promise<HeaderConfig> {
    const response = await anonymousApiClient.get<{ success: boolean; data: HeaderConfig }>(
      `/public/navigation/${tenantSlug}/header`
    );
    return response.data;
  },

  async getFooter(tenantSlug: string): Promise<FooterConfig> {
    const response = await anonymousApiClient.get<{ success: boolean; data: FooterConfig }>(
      `/public/navigation/${tenantSlug}/footer`
    );
    return response.data;
  },

  async getMenus(tenantSlug: string, location?: 'header' | 'footer' | 'mobile' | 'all'): Promise<Menu[]> {
    const response = await anonymousApiClient.get<{ success: boolean; data: Menu[] }>(
      `/public/navigation/${tenantSlug}/menus`,
      {params: { location }}
    );
    return response.data;
  },
};

