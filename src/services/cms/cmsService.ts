// Phase 4 CMS API Service
// Integrating with Hexagonal Architecture + Use Cases + Command/Query handlers
import { platformApiClient } from '@/services/platform/platformApiClient';
import { tenantApiClient } from '@/services/tenant/tenantApiClient';

interface CMSApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    tenant_context: string;
    request_id: string;
  };
}

interface CMSPage {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  description?: string;
  content: Record<string, any>;
  template: string;
  meta_data?: Record<string, any>;
  status: 'draft' | 'published' | 'archived';
  is_homepage: boolean;
  sort_order: number;
  language: string;
  parent_id?: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

interface CMSPageVersion {
  id: number;
  page_id: number;
  version_number: number;
  content: Record<string, any>;
  meta_data?: Record<string, any>;
  change_description?: string;
  created_by: number;
  is_current: boolean;
  created_at: string;
}

interface CreatePageRequest {
  title: string;
  slug?: string;
  description?: string;
  content: Record<string, any>;
  template?: string;
  meta_data?: Record<string, any>;
  status?: 'draft' | 'published' | 'archived';
  language?: string;
  parent_id?: number;
}

interface UpdatePageRequest {
  title?: string;
  slug?: string;
  description?: string;
  content?: Record<string, any>;
  template?: string;
  meta_data?: Record<string, any>;
  status?: 'draft' | 'published' | 'archived';
  is_homepage?: boolean;
  sort_order?: number;
  parent_id?: number;
  create_version?: boolean;
  change_description?: string;
}

class CMSService {
  private isPlatformMode: boolean = false;

  constructor() {
    // Determine if we're in platform mode based on URL or account type
    this.isPlatformMode = window.location.pathname.includes('/platform/') || 
                         localStorage.getItem('account_type') === 'platform';
  }

  private isTestMode(): boolean {
    return import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';
  }

  private async apiCall<T>(method: string, endpoint: string, data?: any): Promise<T> {
    try {
      // In test mode, use direct axios to avoid authentication interceptors
      if (this.isTestMode() && endpoint.startsWith('/test/')) {
        const axios = (await import('axios')).default;
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
        
        const config: any = {
          method,
          url: `${baseURL}${endpoint}`,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          config.data = data;
        }

        const response = await axios.request(config);
        return response.data as T;
      }

      // Normal mode - use the appropriate API client based on mode
      const config: any = {
        method,
        url: endpoint,
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
      }

      const apiClient = this.isPlatformMode ? platformApiClient : tenantApiClient;
      const response = await apiClient.request(config);
      
      // Return the response data directly as the expected type
      return response.data as T;
    } catch (error: any) {
      console.error(`CMS API ${method} ${endpoint} failed:`, error);
      throw new Error(error.message || `Failed to ${method} ${endpoint}`);
    }
  }

  // Phase 4 CMS Query Handlers Integration
  
  /**
   * Get Pages (Query) - Following GetPlatformPagesQuery handler pattern
   * Endpoint: GET /platform/content/pages (Platform) or GET /tenant/cms/pages (Tenant)
   */
  async getPages(filters?: {
    status?: string;
    language?: string;
    search?: string;
    parent_id?: number;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<CMSApiResponse<CMSPage[]>> {
    // Use test endpoints in development mode to avoid authentication issues
    let endpoint: string;
    if (this.isTestMode()) {
      endpoint = this.isPlatformMode ? '/test/platform/content/pages' : '/test/tenant/cms/pages';
    } else {
      endpoint = this.isPlatformMode ? '/content/pages' : '/cms/pages';
    }
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
    return this.apiCall<CMSApiResponse<CMSPage[]>>('GET', url);
  }

  /**
   * Get Page by UUID - Following GetPlatformPagesQuery handler pattern
   * Endpoint: GET /platform/content/pages/{uuid} (Platform) or GET /tenant/cms/pages/{uuid} (Tenant)
   */
  async getPageByUuid(uuid: string): Promise<CMSApiResponse<CMSPage>> {
    const endpoint = this.isPlatformMode ? `/content/pages/${uuid}` : `/cms/pages/${uuid}`;
    return this.apiCall<CMSApiResponse<CMSPage>>('GET', endpoint);
  }

  /**
   * Get Page by Slug - Custom query for admin panel integration
   */
  async getPageBySlug(slug: string): Promise<CMSApiResponse<CMSPage>> {
    const response = await this.getPages({ 
      search: slug, 
      per_page: 1 
    });

    let page: CMSPage | undefined;
    if (response.data && Array.isArray(response.data)) {
      page = response.data.find((p: CMSPage) => p.slug === slug);
    } else if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
      page = response.data.data.find((p: CMSPage) => p.slug === slug);
    }

    if (!page) {
      throw new Error(`Page with slug "${slug}" not found`);
    }

    return {
      success: true,
      data: page,
      meta: response.meta
    };
  }

  // Phase 4 CMS Use Cases Integration

  /**
   * Create Page (Use Case) - Following CreatePlatformPageUseCase pattern
   * Endpoint: POST /platform/content/pages (Platform) or POST /tenant/cms/pages (Tenant)
   * 
   * Architecture Flow:
   * Controller → CreatePageUseCase → HTMLPurifier → Domain → Repository
   */
  async createPage(pageData: CreatePageRequest): Promise<CMSApiResponse<CMSPage>> {
    const endpoint = this.isPlatformMode ? '/content/pages' : '/cms/pages';
    const data = {
      ...pageData,
      language: pageData.language || 'en',
      template: pageData.template || 'default',
      status: pageData.status || 'draft'
    };

    return this.apiCall<CMSApiResponse<CMSPage>>('POST', endpoint, data);
  }

  /**
   * Update Page (Use Case) - Following UpdatePlatformPageUseCase pattern
   * Endpoint: PUT /platform/content/pages/{uuid} (Platform) or PATCH /tenant/cms/pages/{uuid} (Tenant)
   * 
   * Architecture Flow:
   * Controller → UpdatePageUseCase → HTMLPurifier → Domain → Repository
   * Optional: Content versioning with PageVersionCreated event
   */
  async updatePage(uuid: string, pageData: UpdatePageRequest): Promise<CMSApiResponse<CMSPage>> {
    const endpoint = this.isPlatformMode ? `/content/pages/${uuid}` : `/cms/pages/${uuid}`;
    const method = this.isPlatformMode ? 'PUT' : 'PATCH';

    return this.apiCall<CMSApiResponse<CMSPage>>(method, endpoint, pageData);
  }

  /**
   * Delete Page (Use Case) - Following DeletePlatformPageUseCase pattern
   * Endpoint: DELETE /platform/content/pages/{uuid} (Platform) or DELETE /tenant/cms/pages/{uuid} (Tenant)
   */
  async deletePage(uuid: string): Promise<CMSApiResponse<void>> {
    const endpoint = this.isPlatformMode ? `/content/pages/${uuid}` : `/cms/pages/${uuid}`;
    return this.apiCall<CMSApiResponse<void>>('DELETE', endpoint);
  }

  // Content Versioning Support

  /**
   * Get Page Versions - Following Phase 4 versioning system
   * Endpoint: GET /tenant/cms/pages/{uuid}/versions
   */
  async getPageVersions(uuid: string): Promise<CMSApiResponse<CMSPageVersion[]>> {
    const endpoint = this.isPlatformMode ? `/content/pages/${uuid}/versions` : `/cms/pages/${uuid}/versions`;
    return this.apiCall<CMSApiResponse<CMSPageVersion[]>>('GET', endpoint);
  }

  /**
   * Restore Page Version - Following Phase 4 versioning system
   * Endpoint: POST /tenant/cms/pages/{uuid}/versions/{version}/restore
   */
  async restorePageVersion(uuid: string, version: number): Promise<CMSApiResponse<CMSPage>> {
    const endpoint = this.isPlatformMode ? `/content/pages/${uuid}/versions/${version}/restore` : `/cms/pages/${uuid}/versions/${version}/restore`;
    return this.apiCall<CMSApiResponse<CMSPage>>('POST', endpoint);
  }

  // Content Blocks Support (Phase 4 CMS Enhancement)

  /**
   * Get Content Blocks - Following Phase 4 content block system
   * Endpoint: GET /tenant/cms/content-blocks
   */
  async getContentBlocks(filters?: {
    category?: string;
    is_active?: boolean;
  }): Promise<CMSApiResponse<any[]>> {
    const endpoint = this.isPlatformMode ? '/content/content-blocks' : '/cms/content-blocks';
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
    return this.apiCall<CMSApiResponse<any[]>>('GET', url);
  }

  // Legacy Support for Current Admin Pages

  /**
   * Legacy adapter for existing ContentContext
   * Maps old interface to new Phase 4 CMS endpoints
   */
  async getLegacyPageContent(slug: string): Promise<{
    id: string;
    pageSlug: string;
    content: Record<string, any>;
    status: string;
    publishedAt?: string;
    version: number;
    createdAt: string;
    updatedAt: string;
  } | null> {
    try {
      const response = await this.getPageBySlug(slug);
      const page = response.data;

      return {
        id: page.uuid,
        pageSlug: page.slug,
        content: page.content,
        status: page.status,
        publishedAt: page.published_at,
        version: 1, // TODO: Get from versioning system
        createdAt: page.created_at,
        updatedAt: page.updated_at,
      };
    } catch (error) {
      console.error(`Failed to load page content for ${slug}:`, error);
      return null;
    }
  }

  /**
   * Legacy adapter for updating page content
   * Maps old interface to Phase 4 UpdatePageUseCase
   */
  async updateLegacyPageContent(slug: string, content: Record<string, any>): Promise<boolean> {
    try {
      // First get the page to find UUID
      const pageResponse = await this.getPageBySlug(slug);
      const page = pageResponse.data;

      // Update via Phase 4 UpdatePageUseCase
      await this.updatePage(page.uuid, {
        content,
        create_version: true,
        change_description: `Content updated via admin panel at ${new Date().toISOString()}`
      });

      return true;
    } catch (error) {
      console.error(`Failed to update page content for ${slug}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const cmsService = new CMSService();
export default cmsService;