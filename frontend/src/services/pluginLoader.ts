import { pluginLoader as basePluginLoader } from '@canvastencil/plugin-runtime';
import type { ApiClient } from '@canvastencil/plugin-runtime';
import { tenantApiClient } from './tenant/tenantApiClient';
import { pluginModules } from './pluginRegistry';

// Use explicit plugin registry instead of glob for reliability
console.log('[pluginLoader] Plugin registry loaded with modules:', Object.keys(pluginModules));
console.log('[pluginLoader] Total plugin modules found:', Object.keys(pluginModules).length);
basePluginLoader.setPluginModules(pluginModules);

// ✅ FIX: Adapt tenantApiClient (AxiosInstance) to ApiClient interface
const tenantApiClientAdapter: ApiClient = {
  get: <T>(url: string, config?: any): Promise<T> => 
    tenantApiClient.get(url, config).then(response => response as T),
  
  post: <T>(url: string, data?: any, config?: any): Promise<T> => 
    tenantApiClient.post(url, data, config).then(response => response as T),
  
  put: <T>(url: string, data?: any, config?: any): Promise<T> => 
    tenantApiClient.put(url, data, config).then(response => response as T),
  
  patch: <T>(url: string, data?: any, config?: any): Promise<T> => 
    tenantApiClient.patch(url, data, config).then(response => response as T),
  
  delete: <T>(url: string, config?: any): Promise<T> => 
    tenantApiClient.delete(url, config).then(response => response as T),
  
  setAuthToken: (token: string) => {
    localStorage.setItem('auth_token', token);
    tenantApiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  
  clearAuthToken: () => {
    localStorage.removeItem('auth_token');
    delete tenantApiClient.defaults.headers.common['Authorization'];
  },
};

// Inject tenant-specific API client adapter
basePluginLoader.setApiClient(tenantApiClientAdapter);

console.log('[pluginLoader] Configured with tenant API client adapter');

export const pluginLoader = basePluginLoader;
export type { 
  PluginModule, 
  MenuItem, 
  InstalledPlugin,
  InstalledPluginsResponse
} from '@canvastencil/plugin-runtime';
