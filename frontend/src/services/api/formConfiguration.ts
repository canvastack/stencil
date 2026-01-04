import { tenantApiClient } from '../tenant/tenantApiClient';
import { anonymousApiClient } from './anonymousApiClient';
import type { FormConfiguration, FormTemplate, FormSchema } from '@/types/form-builder';
import type { PaginatedResponse } from '@/types/api';

export interface CreateFormConfigurationRequest {
  name?: string;
  description?: string;
  form_schema: FormSchema;
  validation_rules?: Record<string, any>;
  conditional_logic?: Record<string, any>;
  is_default?: boolean;
  template_id?: number;
}

export interface UpdateFormConfigurationRequest extends Partial<CreateFormConfigurationRequest> {
  is_active?: boolean;
}

export interface ApplyTemplateRequest {
  product_uuids: string[];
  is_active?: boolean;
}

class FormConfigurationService {
  async getFormConfiguration(productUuid: string): Promise<FormConfiguration> {
    const response = await tenantApiClient.get<{ data: FormConfiguration }>(
      `/products/${productUuid}/form-configuration`
    );
    return response.data;
  }

  async getPublicFormConfiguration(productUuid: string): Promise<{
    product_uuid: string;
    product_name: string;
    form_schema: FormSchema;
    conditional_logic: Record<string, any>;
    version: number;
  }> {
    const response = await anonymousApiClient.get<{
      data: {
        product_uuid: string;
        product_name: string;
        form_schema: FormSchema;
        conditional_logic: Record<string, any>;
        version: number;
      };
    }>(`/public/products/${productUuid}/form-configuration`);
    return response.data;
  }

  async createFormConfiguration(
    productUuid: string,
    data: CreateFormConfigurationRequest
  ): Promise<FormConfiguration> {
    const response = await tenantApiClient.post<{ data: FormConfiguration }>(
      `/products/${productUuid}/form-configuration`,
      data
    );
    return response.data;
  }

  async updateFormConfiguration(
    productUuid: string,
    data: UpdateFormConfigurationRequest
  ): Promise<FormConfiguration> {
    const response = await tenantApiClient.put<{ data: FormConfiguration }>(
      `/products/${productUuid}/form-configuration`,
      data
    );
    return response.data;
  }

  async deleteFormConfiguration(productUuid: string): Promise<void> {
    await tenantApiClient.delete(`/products/${productUuid}/form-configuration`);
  }

  async duplicateFormConfiguration(
    targetProductUuid: string,
    sourceProductUuid: string,
    isActive = true
  ): Promise<FormConfiguration> {
    const response = await tenantApiClient.post<{ data: FormConfiguration }>(
      `/products/${targetProductUuid}/form-configuration/duplicate`,
      {
        source_product_uuid: sourceProductUuid,
        is_active: isActive,
      }
    );
    return response.data;
  }

  async getTemplates(filters?: {
    search?: string;
    category?: string;
    is_system?: boolean;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    include_schema?: boolean;
  }): Promise<PaginatedResponse<FormTemplate>> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.is_system !== undefined) params.append('is_system', String(filters.is_system));
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);
      if (filters.include_schema !== undefined) params.append('include_schema', String(filters.include_schema));
    }

    const response = await tenantApiClient.get<{
      data: FormTemplate[];
      meta: {
        current_page: number;
        total: number;
        per_page: number;
        last_page: number;
      };
    }>(`/form-templates?${params.toString()}`);

    return {
      data: response.data,
      current_page: response.meta.current_page,
      total: response.meta.total,
      per_page: response.meta.per_page,
      last_page: response.meta.last_page,
    };
  }

  async getTemplateById(uuid: string): Promise<FormTemplate> {
    const response = await tenantApiClient.get<{ data: FormTemplate }>(
      `/form-templates/${uuid}`
    );
    return response.data;
  }

  async createTemplate(data: {
    name: string;
    description?: string;
    category: string;
    form_schema: FormSchema;
    validation_rules?: Record<string, any>;
    conditional_logic?: Record<string, any>;
    is_public?: boolean;
    preview_image_url?: string;
    tags?: string[];
  }): Promise<FormTemplate> {
    const response = await tenantApiClient.post<{ data: FormTemplate }>(
      '/form-templates',
      data
    );
    return response.data;
  }

  async updateTemplate(
    uuid: string,
    data: Partial<{
      name: string;
      description: string;
      category: string;
      form_schema: FormSchema;
      validation_rules: Record<string, any>;
      conditional_logic: Record<string, any>;
      is_public: boolean;
      preview_image_url: string;
      tags: string[];
    }>
  ): Promise<FormTemplate> {
    const response = await tenantApiClient.put<{ data: FormTemplate }>(
      `/form-templates/${uuid}`,
      data
    );
    return response.data;
  }

  async deleteTemplate(uuid: string): Promise<void> {
    await tenantApiClient.delete(`/form-templates/${uuid}`);
  }

  async applyTemplate(
    templateUuid: string,
    data: ApplyTemplateRequest
  ): Promise<{ success: number; failed: number; results: any[] }> {
    const response = await tenantApiClient.post<{
      data: { success: number; failed: number; results: any[] };
    }>(`/form-templates/${templateUuid}/apply`, data);
    return response.data;
  }

  async submitPublicForm(
    productUuid: string,
    data: Record<string, any>
  ): Promise<{
    submission_uuid: string;
    product_uuid: string;
    customer_uuid?: string;
    submitted_at: string;
  }> {
    const response = await anonymousApiClient.post<{
      data: {
        submission_uuid: string;
        product_uuid: string;
        customer_uuid?: string;
        submitted_at: string;
      };
    }>(`/public/products/${productUuid}/form-submission`, data);
    return response.data;
  }
}

export const formConfigurationService = new FormConfigurationService();
