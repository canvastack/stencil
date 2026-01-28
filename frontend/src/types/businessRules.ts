export type RuleCategory = 'all' | 'order' | 'customer' | 'vendor' | 'payment' | 'quality' | 'security';

export interface BusinessRule {
  code: string;
  name: string;
  description: string;
  category: RuleCategory;
  defaultPriority: number;
  applicableContexts: string[];
  defaultParameters?: Record<string, any>;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleConfiguration {
  id: string;
  tenantId: string;
  ruleCode: string;
  enabled: boolean;
  priority: number;
  parameters: Record<string, any>;
  applicableContexts: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RuleResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: Record<string, any>;
  executionTime: number;
  ruleCode: string;
}

export interface RuleValidationContext {
  orderValue?: number;
  customerId?: string;
  vendorId?: string;
  orderRequirements?: any;
  paymentType?: string;
  [key: string]: any;
}

export interface BusinessRuleStats {
  totalRules: number;
  enabledRules: number;
  disabledRules: number;
  rulesWithErrors: number;
  averageExecutionTime: number;
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
}

export interface RuleExecutionLog {
  id: string;
  tenantId: string;
  ruleCode: string;
  context: string;
  result: RuleResult;
  executedAt: string;
  executionTime: number;
}