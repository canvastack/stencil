import { tenantApiClient } from '../tenant/tenantApiClient';
import { Plugin, InstalledPlugin, PluginRequestPayload, PluginUninstallPayload } from '@/types/plugin';

export interface PluginMarketplaceResponse {
  success: boolean;
  data: Plugin[];
  message: string;
}

export interface PluginDetailsResponse {
  success: boolean;
  data: Plugin;
  message: string;
}

export interface InstalledPluginsResponse {
  success: boolean;
  data: InstalledPlugin[];
  message: string;
}

export interface InstalledPluginDetailsResponse {
  success: boolean;
  data: InstalledPlugin;
  message: string;
}

export interface PluginRequestResponse {
  success: boolean;
  data: {
    uuid: string;
    status: string;
    requested_at: string;
  };
  message: string;
}

export interface PluginActionResponse {
  success: boolean;
  message: string;
}

export interface PluginSettingsUpdatePayload {
  settings: Record<string, any>;
}

export interface PluginSettingsUpdateResponse {
  success: boolean;
  data: {
    uuid: string;
    settings: Record<string, any>;
  };
  message: string;
}

class PluginService {
  async getMarketplacePlugins(): Promise<Plugin[]> {
    const response = await tenantApiClient.get<PluginMarketplaceResponse>('/plugins/marketplace');
    return response.data;
  }

  async getPluginDetails(pluginName: string): Promise<Plugin> {
    const response = await tenantApiClient.get<PluginDetailsResponse>(`/plugins/marketplace/${pluginName}`);
    return response.data;
  }

  async requestPlugin(payload: PluginRequestPayload): Promise<PluginRequestResponse> {
    const response = await tenantApiClient.post<PluginRequestResponse>('/plugins/request', payload);
    return response;
  }

  async getInstalledPlugins(): Promise<InstalledPlugin[]> {
    const response = await tenantApiClient.get<InstalledPluginsResponse>('/plugins/installed');
    return response.data;
  }

  async getInstalledPluginDetails(uuid: string): Promise<InstalledPlugin> {
    const response = await tenantApiClient.get<InstalledPluginDetailsResponse>(`/plugins/installed/${uuid}`);
    return response.data;
  }

  async uninstallPlugin(uuid: string, payload?: PluginUninstallPayload): Promise<void> {
    await tenantApiClient.delete<PluginActionResponse>(`/plugins/uninstall/${uuid}`, payload);
  }

  async updatePluginSettings(uuid: string, payload: PluginSettingsUpdatePayload): Promise<InstalledPlugin> {
    const response = await tenantApiClient.put<PluginSettingsUpdateResponse>(
      `/plugins/installed/${uuid}/settings`,
      payload
    );
    return { ...await this.getInstalledPluginDetails(uuid), settings: response.data.settings };
  }
}

export const pluginService = new PluginService();
