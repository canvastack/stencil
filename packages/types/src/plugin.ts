import type { RouteObject } from 'react-router-dom';

export interface PluginMetadata {
  name: string;
  version: string;
  displayName?: string;
  description?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  permission?: string;
}

export interface PluginModule {
  name: string;
  version: string;
  displayName?: string;
  description?: string;
  adminRoutes?: RouteObject[];
  publicRoutes?: RouteObject[];
  menuItems?: MenuItem[];
  PLUGIN_METADATA?: PluginMetadata;
}

export interface InstalledPlugin {
  uuid: string;
  plugin_name: string;
  version: string;
  status: 'active' | 'inactive';
  tenant_id?: string;
}

export interface InstalledPluginsResponse {
  data: InstalledPlugin[];
}
