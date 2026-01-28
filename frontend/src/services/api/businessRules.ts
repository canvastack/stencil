import { apiClient } from './client';
import { 
  BusinessRule, 
  RuleConfiguration, 
  RuleResult, 
  BusinessRuleStats, 
  RuleExecutionLog,
  RuleValidationContext 
} from '@/types/businessRules';

export const businessRulesService = {
  // Get all available business rules
  async getAllRules(): Promise<BusinessRule[]> {
    console.log('🔄 API: Calling getAllRules...');
    const response = await apiClient.get('/admin/business-rules');
    console.log('✅ API: getAllRules response:', response);
    
    // API client returns response.data, backend returns {success: true, data: {...}}
    const responseData = response.data;
    console.log('📊 API: Response structure:', responseData);
    
    // Extract the actual data from the response
    const data = responseData?.data || responseData;
    console.log('📊 API: Raw data:', data);
    
    // Backend returns array in data property after fix
    if (Array.isArray(data)) {
      return data.map((rule: any) => ({
        code: rule.code,
        name: rule.name,
        description: rule.description,
        category: rule.category,
        defaultPriority: rule.defaultPriority || rule.priority || 100,
        applicableContexts: rule.applicableContexts || [],
        defaultParameters: rule.defaultParameters || {},
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }
    
    // If backend still returns object format, convert to array
    if (typeof data === 'object' && !Array.isArray(data)) {
      const mappedData = Object.values(data).map((rule: any) => ({
        code: rule.code,
        name: rule.name,
        description: rule.description,
        category: rule.category,
        defaultPriority: rule.defaultPriority || rule.priority || 100,
        applicableContexts: rule.applicableContexts || [],
        defaultParameters: rule.defaultParameters || {},
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      console.log('🔄 API: Mapped data:', mappedData);
      return mappedData;
    }
    
    console.log('🔄 API: Returning empty array - unexpected data format');
    return [];
  },

  // Get rule by code
  async getRule(ruleCode: string): Promise<BusinessRule> {
    const response = await apiClient.get(`/admin/business-rules/${ruleCode}`);
    return response.data.data;
  },

  // Get all rule configurations for current tenant
  async getAllConfigurations(): Promise<RuleConfiguration[]> {
    console.log('🔄 API: Calling getAllConfigurations...');
    const response = await apiClient.get('/admin/business-rules/configurations');
    console.log('✅ API: getAllConfigurations response:', response);
    
    // API client returns response.data, backend returns {success: true, data: [...]}
    const responseData = response.data;
    console.log('📊 API: Response structure:', responseData);
    
    // Extract the actual data array from the response
    const data = responseData?.data || responseData;
    console.log('📊 API: Configurations data:', data);
    
    // Ensure we return an array
    const result = Array.isArray(data) ? data : [];
    console.log('🔄 API: Returning configurations:', result);
    return result;
  },

  // Get configuration for specific rule
  async getRuleConfiguration(ruleCode: string): Promise<RuleConfiguration> {
    const response = await apiClient.get(`/admin/business-rules/configurations/${ruleCode}`);
    return response.data.data;
  },

  // Update rule configuration
  async updateRuleConfiguration(
    ruleCode: string, 
    updates: Partial<Pick<RuleConfiguration, 'enabled' | 'priority' | 'parameters' | 'applicableContexts'>>
  ): Promise<RuleConfiguration> {
    const response = await apiClient.put(`/admin/business-rules/configurations/${ruleCode}`, updates);
    return response.data.data;
  },

  // Test a rule with sample data
  async testRule(ruleCode: string, context?: RuleValidationContext): Promise<RuleResult> {
    const response = await apiClient.post(`/admin/business-rules/${ruleCode}/test`, { context });
    return response.data.data;
  },

  // Validate context against all applicable rules
  async validateContext(contextType: string, data: RuleValidationContext): Promise<RuleResult[]> {
    const response = await apiClient.post('/admin/business-rules/validate', {
      context: contextType,
      data
    });
    return response.data.data;
  },

  // Get business rules statistics
  async getStats(): Promise<BusinessRuleStats> {
    const response = await apiClient.get('/admin/business-rules/stats');
    return response.data.data;
  },

  // Get rule execution logs
  async getExecutionLogs(params?: {
    ruleCode?: string;
    context?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: RuleExecutionLog[]; total: number }> {
    const response = await apiClient.get('/admin/business-rules/logs', { params });
    return response.data.data;
  },

  // Create custom rule configuration
  async createCustomRule(rule: Omit<BusinessRule, 'code' | 'version' | 'createdAt' | 'updatedAt'>): Promise<BusinessRule> {
    const response = await apiClient.post('/admin/business-rules/custom', rule);
    return response.data.data;
  },

  // Delete custom rule
  async deleteCustomRule(ruleCode: string): Promise<void> {
    await apiClient.delete(`/admin/business-rules/custom/${ruleCode}`);
  },

  // Export rule configurations
  async exportConfigurations(): Promise<Blob> {
    const response = await apiClient.get('/admin/business-rules/export', {
      responseType: 'blob'
    });
    return response.data;
  },

  // Import rule configurations
  async importConfigurations(file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/admin/business-rules/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  },

  // Reset rule configuration to defaults
  async resetRuleConfiguration(ruleCode: string): Promise<RuleConfiguration> {
    const response = await apiClient.post(`/admin/business-rules/configurations/${ruleCode}/reset`);
    return response.data.data;
  },

  // Bulk update rule configurations
  async bulkUpdateConfigurations(updates: Array<{
    ruleCode: string;
    enabled?: boolean;
    priority?: number;
    parameters?: Record<string, any>;
  }>): Promise<RuleConfiguration[]> {
    const response = await apiClient.put('/admin/business-rules/configurations/bulk', { updates });
    return response.data.data;
  }
};