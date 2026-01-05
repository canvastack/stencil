import { useState, useCallback, useEffect } from 'react';
import { 
  formConfigurationService, 
  CreateFormConfigurationRequest, 
  UpdateFormConfigurationRequest 
} from '@/services/api/formConfiguration';
import type { FormConfiguration, FormTemplate, FormSchema } from '@/types/form-builder';
import type { PaginatedResponse } from '@/types/api';
import { toast } from 'sonner';

interface UseFormConfigurationState {
  configuration: FormConfiguration | null;
  templates: FormTemplate[];
  currentTemplate: FormTemplate | null;
  templatePagination: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

export const useFormConfiguration = (productUuid?: string) => {
  const [state, setState] = useState<UseFormConfigurationState>({
    configuration: null,
    templates: [],
    currentTemplate: null,
    templatePagination: {
      page: 1,
      per_page: 20,
      total: 0,
      last_page: 1,
    },
    isLoading: false,
    isSaving: false,
    error: null,
  });

  const fetchConfiguration = useCallback(
    async (uuid?: string) => {
      const targetUuid = uuid || productUuid;
      if (!targetUuid) {
        console.warn('[useFormConfiguration] No product UUID provided to fetchConfiguration');
        return;
      }

      console.log('[useFormConfiguration] Fetching configuration for:', targetUuid);
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const configuration = await formConfigurationService.getFormConfiguration(targetUuid);
        console.log('[useFormConfiguration] Configuration fetched:', configuration);
        setState((prev) => ({ ...prev, configuration, isLoading: false }));
        return configuration;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch form configuration';
        console.log('[useFormConfiguration] Fetch error:', message);
        setState((prev) => ({ ...prev, error: message, isLoading: false, configuration: null }));
        if (!message.includes('404')) {
          toast.error(message);
        }
      }
    },
    [productUuid]
  );

  const saveConfiguration = useCallback(
    async (data: CreateFormConfigurationRequest, uuid?: string) => {
      const targetUuid = uuid || productUuid;
      if (!targetUuid) {
        toast.error('Product UUID is required');
        return;
      }

      setState((prev) => ({ ...prev, isSaving: true, error: null }));
      try {
        const configuration = await formConfigurationService.createFormConfiguration(
          targetUuid,
          data
        );
        setState((prev) => ({ ...prev, configuration, isSaving: false }));
        toast.success('Form configuration saved successfully');
        return configuration;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save form configuration';
        setState((prev) => ({ ...prev, error: message, isSaving: false }));
        toast.error(message);
      }
    },
    [productUuid]
  );

  const updateConfiguration = useCallback(
    async (data: UpdateFormConfigurationRequest, uuid?: string) => {
      const targetUuid = uuid || productUuid;
      if (!targetUuid) {
        toast.error('Product UUID is required');
        return;
      }

      setState((prev) => ({ ...prev, isSaving: true, error: null }));
      try {
        const configuration = await formConfigurationService.updateFormConfiguration(
          targetUuid,
          data
        );
        setState((prev) => ({ ...prev, configuration, isSaving: false }));
        toast.success('Form configuration updated successfully');
        return configuration;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update form configuration';
        setState((prev) => ({ ...prev, error: message, isSaving: false }));
        toast.error(message);
      }
    },
    [productUuid]
  );

  const deleteConfiguration = useCallback(
    async (uuid?: string) => {
      const targetUuid = uuid || productUuid;
      if (!targetUuid) {
        toast.error('Product UUID is required');
        return;
      }

      setState((prev) => ({ ...prev, isSaving: true, error: null }));
      try {
        await formConfigurationService.deleteFormConfiguration(targetUuid);
        setState((prev) => ({ ...prev, configuration: null, isSaving: false }));
        toast.success('Form configuration deleted successfully');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete form configuration';
        setState((prev) => ({ ...prev, error: message, isSaving: false }));
        toast.error(message);
      }
    },
    [productUuid]
  );

  const duplicateConfiguration = useCallback(
    async (sourceProductUuid: string, targetUuid?: string, isActive = true) => {
      const targetProductUuid = targetUuid || productUuid;
      if (!targetProductUuid) {
        toast.error('Target product UUID is required');
        return;
      }

      setState((prev) => ({ ...prev, isSaving: true, error: null }));
      try {
        const configuration = await formConfigurationService.duplicateFormConfiguration(
          targetProductUuid,
          sourceProductUuid,
          isActive
        );
        setState((prev) => ({ ...prev, configuration, isSaving: false }));
        toast.success('Form configuration duplicated successfully');
        return configuration;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to duplicate form configuration';
        setState((prev) => ({ ...prev, error: message, isSaving: false }));
        toast.error(message);
      }
    },
    [productUuid]
  );

  const fetchTemplates = useCallback(async (filters?: {
    search?: string;
    category?: string;
    is_system?: boolean;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    include_schema?: boolean;
  }) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response: PaginatedResponse<FormTemplate> = await formConfigurationService.getTemplates(filters);
      setState((prev) => ({
        ...prev,
        templates: response.data,
        templatePagination: {
          page: response.current_page || 1,
          per_page: response.per_page || 20,
          total: response.total || 0,
          last_page: response.last_page || 1,
        },
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch templates';
      setState((prev) => ({ 
        ...prev, 
        templates: [],
        error: message, 
        isLoading: false 
      }));
      toast.error(message);
    }
  }, []);

  const fetchTemplateById = useCallback(async (uuid: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const template = await formConfigurationService.getTemplateById(uuid);
      setState((prev) => ({ ...prev, currentTemplate: template, isLoading: false }));
      return template;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch template';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const applyTemplate = useCallback(
    async (templateUuid: string, productUuids: string[]) => {
      setState((prev) => ({ ...prev, isSaving: true, error: null }));
      try {
        const result = await formConfigurationService.applyTemplate(templateUuid, {
          product_uuids: productUuids,
          is_active: true,
        });
        
        setState((prev) => ({ ...prev, isSaving: false }));
        
        if (result.success > 0) {
          toast.success(`Template applied to ${result.success} product(s)`);
        }
        if (result.failed > 0) {
          toast.error(`Failed to apply template to ${result.failed} product(s)`);
        }
        
        if (productUuids.includes(productUuid || '')) {
          await fetchConfiguration();
        }
        
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to apply template';
        setState((prev) => ({ ...prev, error: message, isSaving: false }));
        toast.error(message);
      }
    },
    [productUuid, fetchConfiguration]
  );

  useEffect(() => {
    if (productUuid) {
      fetchConfiguration();
    }
  }, [productUuid, fetchConfiguration]);

  return {
    configuration: state.configuration,
    templates: state.templates,
    currentTemplate: state.currentTemplate,
    templatePagination: state.templatePagination,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    fetchConfiguration,
    saveConfiguration,
    updateConfiguration,
    deleteConfiguration,
    duplicateConfiguration,
    fetchTemplates,
    fetchTemplateById,
    applyTemplate,
  };
};

export const usePublicFormConfiguration = (productUuid: string) => {
  const [formConfig, setFormConfig] = useState<{
    product_uuid: string;
    product_name: string;
    form_schema: FormSchema;
    conditional_logic: Record<string, any>;
    version: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicConfig = async () => {
      if (!productUuid) {
        console.log('[usePublicFormConfiguration] No productUuid');
        return;
      }

      console.log('[usePublicFormConfiguration] Fetching for:', productUuid);
      setIsLoading(true);
      setError(null);
      try {
        const config = await formConfigurationService.getPublicFormConfiguration(productUuid);
        console.log('[usePublicFormConfiguration] Config received:', config);
        setFormConfig(config);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch form configuration';
        console.error('[usePublicFormConfiguration] Error:', err);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicConfig();
  }, [productUuid]);

  const submitForm = useCallback(
    async (data: Record<string, any>) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await formConfigurationService.submitPublicForm(productUuid, data);
        toast.success('Form submitted successfully');
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit form';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [productUuid]
  );

  return {
    formConfig,
    isLoading,
    error,
    submitForm,
  };
};
