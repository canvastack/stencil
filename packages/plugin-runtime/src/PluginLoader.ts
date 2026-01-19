import type { RouteObject } from 'react-router-dom';
import type { PluginModule, MenuItem, InstalledPlugin } from '@canvastencil/types';
import type { ApiClient } from '@canvastencil/api-client';

export interface InstalledPluginsResponse {
  data: InstalledPlugin[];
}

class PluginLoader {
  private loadedPlugins: Map<string, PluginModule> = new Map();
  private loadingPromises: Map<string, Promise<PluginModule>> = new Map();
  private pluginModules: Record<string, () => Promise<any>> = {};
  private apiClient: ApiClient | null = null;

  setApiClient(client: ApiClient): void {
    this.apiClient = client;
    console.log('[PluginLoader] API client configured');
  }

  setPluginModules(modules: Record<string, () => Promise<any>>): void {
    this.pluginModules = modules;
    console.log('[PluginLoader] Available plugin modules:', Object.keys(this.pluginModules));
  }

  async loadPlugin(pluginName: string): Promise<PluginModule | null> {
    if (this.loadedPlugins.has(pluginName)) {
      return this.loadedPlugins.get(pluginName)!;
    }

    if (this.loadingPromises.has(pluginName)) {
      return this.loadingPromises.get(pluginName)!;
    }

    const loadPromise = this.doLoadPlugin(pluginName);
    this.loadingPromises.set(pluginName, loadPromise);

    try {
      const module = await loadPromise;
      this.loadedPlugins.set(pluginName, module);
      this.loadingPromises.delete(pluginName);
      return module;
    } catch (error) {
      this.loadingPromises.delete(pluginName);
      console.error(`Failed to load plugin: ${pluginName}`, error);
      return null;
    }
  }

  private async doLoadPlugin(pluginName: string): Promise<PluginModule> {
    try {
      // Find the plugin module by matching the plugin name in the path
      const matchingKey = Object.keys(this.pluginModules).find(key => 
        key.includes(`plugins/${pluginName}/frontend/index.tsx`)
      );
      
      if (!matchingKey) {
        const availablePlugins = Object.keys(this.pluginModules)
          .map(p => {
            const match = p.match(/plugins\/([^/]+)\//);
            return match ? match[1] : null;
          })
          .filter(Boolean)
          .join(', ');
        console.error(`[PluginLoader] Plugin not found: ${pluginName}. Available plugins: ${availablePlugins}`);
        console.error(`[PluginLoader] Available keys:`, Object.keys(this.pluginModules));
        throw new Error(`Plugin module not found: ${pluginName}. Available plugins: ${availablePlugins}`);
      }
      
      console.log(`[PluginLoader] Loading plugin: ${pluginName}, using key: ${matchingKey}`);
      const loader = this.pluginModules[matchingKey];

      console.log(`[PluginLoader] Found loader for ${pluginName}, executing...`);
      const module = await loader() as any;
      
      if (!module.PLUGIN_METADATA) {
        throw new Error(`Plugin ${pluginName} does not export PLUGIN_METADATA`);
      }

      const plugin: PluginModule = {
        name: module.PLUGIN_METADATA.name || pluginName,
        version: module.PLUGIN_METADATA.version || '1.0.0',
        displayName: module.PLUGIN_METADATA.displayName,
        description: module.PLUGIN_METADATA.description,
        adminRoutes: this.extractRoutes(module, 'admin'),
        publicRoutes: this.extractRoutes(module, 'public'),
        menuItems: this.extractMenuItems(module),
      };

      return plugin;
    } catch (error) {
      console.error(`Error loading plugin module ${pluginName}:`, error);
      throw error;
    }
  }

  private extractRoutes(module: any, scope: 'admin' | 'public'): RouteObject[] {
    const routes: RouteObject[] = [];
    
    if (scope === 'admin' && module.AdminRoutes) {
      routes.push(...module.AdminRoutes);
    }
    
    if (scope === 'public' && module.PublicRoutes) {
      routes.push(...module.PublicRoutes);
    }

    return routes;
  }

  private extractMenuItems(module: any): MenuItem[] {
    if (module.MenuItems) {
      return module.MenuItems;
    }
    return [];
  }

  async loadInstalledPlugins(scope: 'tenant' | 'platform' = 'tenant'): Promise<PluginModule[]> {
    if (!this.apiClient) {
      console.error('[PluginLoader] API client not configured. Call setApiClient() first.');
      return [];
    }

    try {
      const endpoint = scope === 'tenant' 
        ? '/plugins/installed'
        : '/platform/plugins';

      console.log(`[PluginLoader] Fetching installed plugins from: ${endpoint}`);
      const response = await this.apiClient.get<InstalledPluginsResponse>(endpoint);
      const installedPlugins: InstalledPlugin[] = response.data || [];

      console.log(`[PluginLoader] Found ${installedPlugins.length} installed plugins`);
      const activePlugins = installedPlugins.filter((p: InstalledPlugin) => p.status === 'active');
      console.log(`[PluginLoader] ${activePlugins.length} active plugins`);

      const loadedModules: PluginModule[] = [];

      for (const plugin of activePlugins) {
        const module = await this.loadPlugin(plugin.plugin_name);
        if (module) {
          loadedModules.push(module);
        }
      }

      console.log(`[PluginLoader] Loaded ${loadedModules.length} plugin modules`);
      return loadedModules;
    } catch (error) {
      console.error('[PluginLoader] Failed to load installed plugins:', error);
      return [];
    }
  }

  getPluginRoutes(scope: 'admin' | 'public'): RouteObject[] {
    const routes: RouteObject[] = [];
    
    for (const plugin of this.loadedPlugins.values()) {
      const pluginRoutes = scope === 'admin' 
        ? plugin.adminRoutes 
        : plugin.publicRoutes;
      
      if (pluginRoutes && pluginRoutes.length > 0) {
        routes.push(...pluginRoutes);
      }
    }
    
    return routes;
  }

  getPluginMenuItems(): MenuItem[] {
    const menuItems: MenuItem[] = [];
    
    for (const plugin of this.loadedPlugins.values()) {
      if (plugin.menuItems && plugin.menuItems.length > 0) {
        menuItems.push(...plugin.menuItems);
      }
    }
    
    return menuItems;
  }

  getLoadedPlugin(pluginName: string): PluginModule | undefined {
    return this.loadedPlugins.get(pluginName);
  }

  getAllLoadedPlugins(): PluginModule[] {
    return Array.from(this.loadedPlugins.values());
  }

  isPluginLoaded(pluginName: string): boolean {
    return this.loadedPlugins.has(pluginName);
  }

  unloadPlugin(pluginName: string): void {
    this.loadedPlugins.delete(pluginName);
    this.loadingPromises.delete(pluginName);
  }

  clearAll(): void {
    this.loadedPlugins.clear();
    this.loadingPromises.clear();
  }
}

export const pluginLoader = new PluginLoader();
