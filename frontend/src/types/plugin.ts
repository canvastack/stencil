export interface PluginMenuItem {
  title: string;
  path: string;
  badge?: string;
  required_permissions?: string[];
  required_roles?: string[];
}

export interface PluginMenu {
  title: string;
  icon: string;
  position?: number;
  visible_for?: 'platform' | 'tenant' | 'both';
  required_roles?: string[];
  required_permissions?: string[];
  children?: PluginMenuItem[];
}

export type PluginSettingFieldType = 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'color';

export interface PluginSettingOption {
  label: string;
  value: string;
}

export interface PluginSettingField {
  key: string;
  type: PluginSettingFieldType;
  label: string;
  description?: string;
  default?: any;
  required?: boolean;
  min?: number;
  max?: number;
  min_length?: number;
  max_length?: number;
  rows?: number;
  options?: PluginSettingOption[];
}

export interface PluginSettingsSchema {
  fields: PluginSettingField[];
}

export interface PluginManifest {
  name: string;
  version: string;
  display_name: string;
  description: string;
  author: string;
  license?: string;
  homepage?: string;
  repository?: string;
  requires?: {
    php?: string;
    laravel?: string;
    postgresql?: string;
  };
  dependencies?: string[];
  permissions?: string[];
  routes?: {
    api?: string;
    web?: string;
  };
  frontend?: {
    admin_module?: string;
    public_module?: string;
  };
  menu?: PluginMenu;
  uninstall_behavior?: 'keep_data' | 'delete_data';
  table_prefix?: string;
  features?: Record<string, boolean>;
  settings?: Record<string, any>;
  settings_schema?: PluginSettingsSchema;
}

export interface Plugin {
  name: string;
  display_name: string;
  version: string;
  description: string;
  author: string;
  icon?: string;
  screenshots?: string[];
  tags?: string[];
  requirements?: {
    php?: string;
    laravel?: string;
    dependencies?: Record<string, string>;
  };
  changelog?: Array<{
    version: string;
    date: string;
    changes: string[];
  }>;
}

export interface InstalledPlugin {
  uuid: string;
  plugin_name: string;
  display_name: string;
  version: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'suspended' | 'expired';
  manifest?: PluginManifest;
  settings?: Record<string, any>;
  requested_at?: string;
  requested_by?: string | { uuid: string; name: string; email: string };
  approved_at?: string;
  approved_by?: string | { uuid: string; name: string; email: string };
  approval_notes?: string;
  installed_at?: string;
  expires_at?: string;
  expiry_notified_at?: string;
  rejected_at?: string;
  rejected_by?: string | { uuid: string; name: string; email: string };
  rejection_reason?: string;
}

export interface PluginRequestPayload {
  plugin_name: string;
}

export interface PluginUninstallPayload {
  delete_data?: boolean;
}

export interface PluginFilters {
  search?: string;
  tags?: string[];
  sort?: 'name' | 'popularity' | 'rating';
  order?: 'asc' | 'desc';
}
