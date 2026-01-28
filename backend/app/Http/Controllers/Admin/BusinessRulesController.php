<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateRuleConfigurationRequest;
use App\Http\Requests\Admin\TestRuleRequest;
use App\Http\Requests\Admin\ValidateContextRequest;
use App\Http\Resources\Admin\BusinessRuleResource;
use App\Http\Resources\Admin\RuleConfigurationResource;
use App\Http\Resources\Admin\RuleResultResource;
use App\Domain\Shared\Rules\BusinessRuleEngine;
use App\Domain\Shared\Rules\Repositories\RuleConfigurationRepositoryInterface;
use App\Domain\Shared\Rules\Repositories\RuleExecutionLogRepositoryInterface;
use App\Domain\Shared\Rules\BusinessRuleRegistry;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class BusinessRulesController extends Controller
{
    public function __construct(
        private BusinessRuleEngine $ruleEngine,
        private RuleConfigurationRepositoryInterface $configRepository,
        private RuleExecutionLogRepositoryInterface $logRepository,
        private BusinessRuleRegistry $ruleRegistry
    ) {
        $this->middleware('auth:sanctum');
        $this->middleware('permission:manage-business-rules');
    }

    /**
     * Get all available business rules
     */
    public function index(): JsonResponse
    {
        $rules = $this->ruleRegistry->getAllRules()->values(); // Use values() to get array instead of keyed object
        
        return response()->json([
            'success' => true,
            'data' => BusinessRuleResource::collection($rules)
        ]);
    }

    /**
     * Get specific business rule
     */
    public function show(string $ruleCode): JsonResponse
    {
        $rule = $this->ruleRegistry->getRule($ruleCode);
        
        if (!$rule) {
            return response()->json([
                'success' => false,
                'message' => 'Business rule not found'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => new BusinessRuleResource($rule)
        ]);
    }

    /**
     * Get all rule configurations for current tenant
     */
    public function configurations(): JsonResponse
    {
        $tenantId = Auth::user()->tenant_id; // Changed - no longer wrapping in UuidValueObject
        $configurations = $this->configRepository->getByTenantId($tenantId);
        
        return response()->json([
            'success' => true,
            'data' => RuleConfigurationResource::collection($configurations)
        ]);
    }

    /**
     * Get configuration for specific rule
     */
    public function getConfiguration(string $ruleCode): JsonResponse
    {
        $tenantId = Auth::user()->tenant_id; // Changed - no longer wrapping in UuidValueObject
        $configuration = $this->configRepository->getByTenantAndRule($tenantId, $ruleCode);
        
        if (!$configuration) {
            return response()->json([
                'success' => false,
                'message' => 'Rule configuration not found'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => new RuleConfigurationResource($configuration)
        ]);
    }

    /**
     * Update rule configuration
     */
    public function updateConfiguration(UpdateRuleConfigurationRequest $request, string $ruleCode): JsonResponse
    {
        $tenantId = Auth::user()->tenant_id; // Changed - no longer wrapping in UuidValueObject
        
        // Get or create configuration
        $configuration = $this->configRepository->getByTenantAndRule($tenantId, $ruleCode);
        
        if (!$configuration) {
            // Create new configuration with defaults
            $rule = $this->ruleRegistry->getRule($ruleCode);
            if (!$rule) {
                return response()->json([
                    'success' => false,
                    'message' => 'Business rule not found'
                ], 404);
            }
            
            $configuration = $this->configRepository->create([
                'tenant_id' => $tenantId, // Changed
                'rule_code' => $ruleCode,
                'enabled' => $request->input('enabled', true),
                'priority' => $request->input('priority', $rule->getDefaultPriority()),
                'parameters' => $request->input('parameters', $rule->getDefaultParameters()),
                'applicable_contexts' => $request->input('applicable_contexts', $rule->getApplicableContexts())
            ]);
        } else {
            // Update existing configuration
            $updateData = array_filter([
                'enabled' => $request->input('enabled'),
                'priority' => $request->input('priority'),
                'parameters' => $request->input('parameters'),
                'applicable_contexts' => $request->input('applicable_contexts')
            ], fn($value) => $value !== null);
            
            $configuration = $this->configRepository->update($configuration, $updateData);
        }
        
        return response()->json([
            'success' => true,
            'data' => new RuleConfigurationResource($configuration),
            'message' => 'Rule configuration updated successfully'
        ]);
    }

    /**
     * Test a business rule
     */
    public function testRule(TestRuleRequest $request, string $ruleCode): JsonResponse
    {
        $rule = $this->ruleRegistry->getRule($ruleCode);
        
        if (!$rule) {
            return response()->json([
                'success' => false,
                'message' => 'Business rule not found'
            ], 404);
        }
        
        try {
            // Create test context
            $context = $this->createTestContext($request->input('context', []));
            
            // Execute rule
            $startTime = microtime(true);
            $result = $rule->evaluate($context);
            $executionTime = (microtime(true) - $startTime) * 1000; // Convert to milliseconds
            
            // Log execution for testing
            $this->logRepository->create([
                'tenant_id' => Auth::user()->tenant_id,
                'rule_code' => $ruleCode,
                'context' => 'test',
                'result' => $result->toArray(),
                'execution_time' => $executionTime,
                'executed_at' => now()
            ]);
            
            return response()->json([
                'success' => true,
                'data' => new RuleResultResource($result, $executionTime, $ruleCode)
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Rule test failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate context against applicable rules
     */
    public function validateContext(ValidateContextRequest $request): JsonResponse
    {
        $contextType = $request->input('context');
        $data = $request->input('data');
        
        try {
            $validationResult = $this->ruleEngine->validateContext($contextType, $data);
            
            return response()->json([
                'success' => true,
                'data' => $validationResult->getResults()->map(fn($result) => 
                    new RuleResultResource($result, $result->getExecutionTime(), $result->getRuleCode())
                )
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Context validation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get business rules statistics
     */
    public function stats(): JsonResponse
    {
        $tenantId = Auth::user()->tenant_id; // Changed - no longer wrapping in UuidValueObject
        
        $totalRules = $this->ruleRegistry->getTotalRules();
        $configurations = $this->configRepository->getByTenantId($tenantId);
        
        $enabledRules = $configurations->filter(fn($config) => $config->isEnabled())->count();
        $disabledRules = $configurations->filter(fn($config) => !$config->isEnabled())->count();
        
        // Get execution statistics from logs (last 30 days)
        $executionStats = $this->logRepository->getStatsByTenant($tenantId, now()->subDays(30));
        
        return response()->json([
            'success' => true,
            'data' => [
                'totalRules' => $totalRules,
                'enabledRules' => $enabledRules,
                'disabledRules' => $disabledRules,
                'rulesWithErrors' => $executionStats['rules_with_errors'] ?? 0,
                'averageExecutionTime' => $executionStats['average_execution_time'] ?? 0,
                'totalValidations' => $executionStats['total_validations'] ?? 0,
                'successfulValidations' => $executionStats['successful_validations'] ?? 0,
                'failedValidations' => $executionStats['failed_validations'] ?? 0
            ]
        ]);
    }

    /**
     * Get rule execution logs
     */
    public function logs(Request $request): JsonResponse
    {
        $tenantId = Auth::user()->tenant_id; // Changed - no longer wrapping in UuidValueObject
        
        $filters = [
            'rule_code' => $request->input('ruleCode'),
            'context' => $request->input('context'),
            'start_date' => $request->input('startDate'),
            'end_date' => $request->input('endDate')
        ];
        
        $limit = $request->input('limit', 50);
        $offset = $request->input('offset', 0);
        
        $result = $this->logRepository->getByTenantWithFilters($tenantId, $filters, $limit, $offset);
        
        return response()->json([
            'success' => true,
            'data' => [
                'logs' => $result['logs'],
                'total' => $result['total']
            ]
        ]);
    }

    /**
     * Reset rule configuration to defaults
     */
    public function resetConfiguration(string $ruleCode): JsonResponse
    {
        $tenantId = Auth::user()->tenant_id; // Changed - no longer wrapping in UuidValueObject
        $rule = $this->ruleRegistry->getRule($ruleCode);
        
        if (!$rule) {
            return response()->json([
                'success' => false,
                'message' => 'Business rule not found'
            ], 404);
        }
        
        $configuration = $this->configRepository->getByTenantAndRule($tenantId, $ruleCode);
        
        if ($configuration) {
            // Reset to defaults
            $configuration = $this->configRepository->update($configuration, [
                'enabled' => true,
                'priority' => $rule->getDefaultPriority(),
                'parameters' => $rule->getDefaultParameters(),
                'applicable_contexts' => $rule->getApplicableContexts()
            ]);
        } else {
            // Create with defaults
            $configuration = $this->configRepository->create([
                'tenant_id' => $tenantId, // Changed - no longer calling getValue()
                'rule_code' => $ruleCode,
                'enabled' => true,
                'priority' => $rule->getDefaultPriority(),
                'parameters' => $rule->getDefaultParameters(),
                'applicable_contexts' => $rule->getApplicableContexts()
            ]);
        }
        
        return response()->json([
            'success' => true,
            'data' => new RuleConfigurationResource($configuration),
            'message' => 'Rule configuration reset to defaults'
        ]);
    }

    /**
     * Create test context for rule testing
     */
    private function createTestContext(array $contextData): object
    {
        // Create a test context object with sample data
        return (object) array_merge([
            'order_value' => 1000000, // IDR 10,000 in cents
            'customer_id' => 'test-customer-uuid',
            'vendor_id' => 'test-vendor-uuid',
            'payment_type' => 'DP50',
            'order_requirements' => [
                'material' => 'stainless_steel',
                'timeline' => '2024-03-01',
                'quality_certifications' => ['ISO9001'],
                'quality_standards' => ['premium']
            ]
        ], $contextData);
    }
}