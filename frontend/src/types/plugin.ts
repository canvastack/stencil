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
  manifest?: any;
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
