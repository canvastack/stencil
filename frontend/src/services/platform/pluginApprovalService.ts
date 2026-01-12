import { platformApiClient } from './platformApiClient';
import { InstalledPlugin } from '@/types/plugin';

export interface PluginApprovalRequest {
  approval_notes?: string;
  expires_at?: string;
}

export interface PluginRejectionRequest {
  rejection_reason: string;
}

export interface PluginSuspensionRequest {
  reason: string;
}

export interface PluginExtensionRequest {
  expires_at: string;
}

export interface PluginRequestsResponse {
  success: boolean;
  data: InstalledPlugin[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
  message: string;
}

export interface PluginRequestDetailsResponse {
  success: boolean;
  data: InstalledPlugin;
  message: string;
}

export interface PluginAnalyticsResponse {
  success: boolean;
  data: {
    summary: {
      total: number;
      active: number;
      pending: number;
      rejected: number;
      suspended: number;
      expired: number;
    };
    by_plugin: Array<{
      plugin_name: string;
      display_name: string;
      installations: number;
    }>;
    recent_requests: Array<{
      uuid: string;
      plugin_name: string;
      tenant: string;
      requested_by: string;
      requested_at: string;
    }>;
  };
  message: string;
}

export interface PluginActionResponse {
  success: boolean;
  message: string;
}

class PluginApprovalService {
  async getPluginRequests(filters?: {
    status?: string;
    plugin_name?: string;
    tenant_id?: string;
    per_page?: number;
    page?: number;
  }): Promise<PluginRequestsResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.plugin_name) params.append('plugin_name', filters.plugin_name);
    if (filters?.tenant_id) params.append('tenant_id', filters.tenant_id);
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());
    if (filters?.page) params.append('page', filters.page.toString());

    const response = await platformApiClient.get<PluginRequestsResponse>(
      `/plugins/requests?${params.toString()}`
    );
    return response;
  }

  async getPluginRequestDetails(uuid: string): Promise<InstalledPlugin> {
    const response = await platformApiClient.get<PluginRequestDetailsResponse>(
      `/plugins/requests/${uuid}`
    );
    return response.data;
  }

  async approveRequest(uuid: string, data: PluginApprovalRequest): Promise<void> {
    await platformApiClient.post<PluginActionResponse>(
      `/plugins/requests/${uuid}/approve`,
      data
    );
  }

  async rejectRequest(uuid: string, data: PluginRejectionRequest): Promise<void> {
    await platformApiClient.post<PluginActionResponse>(
      `/plugins/requests/${uuid}/reject`,
      data
    );
  }

  async suspendPlugin(uuid: string, data: PluginSuspensionRequest): Promise<void> {
    await platformApiClient.post<PluginActionResponse>(
      `/plugins/installed/${uuid}/suspend`,
      data
    );
  }

  async extendPlugin(uuid: string, data: PluginExtensionRequest): Promise<void> {
    await platformApiClient.post<PluginActionResponse>(
      `/plugins/installed/${uuid}/extend`,
      data
    );
  }

  async getAnalytics(): Promise<PluginAnalyticsResponse['data']> {
    const response = await platformApiClient.get<PluginAnalyticsResponse>('/plugins/analytics');
    return response.data;
  }
}

export const pluginApprovalService = new PluginApprovalService();
