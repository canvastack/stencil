<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\ExchangeRateProvider;
use App\Application\ExchangeRate\Services\ProviderManagementService;
use App\Application\ExchangeRate\Services\QuotaManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ExchangeRateProviderController extends Controller
{
    public function __construct(
        private ProviderManagementService $providerManagementService,
        private QuotaManagementService $quotaManagementService
    ) {}

    /**
     * List all exchange rate providers for the authenticated tenant.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $tenantId = auth()->user()->tenant_id;

            $providers = ExchangeRateProvider::where('tenant_id', $tenantId)
                ->orderedByPriority()
                ->get()
                ->map(function ($provider) {
                    return [
                        'uuid' => $provider->uuid,
                        'name' => $provider->name,
                        'code' => $provider->code,
                        'api_url' => $provider->api_url,
                        'requires_api_key' => $provider->requires_api_key,
                        'has_api_key' => !empty($provider->api_key),
                        'is_unlimited' => $provider->is_unlimited,
                        'monthly_quota' => $provider->monthly_quota,
                        'priority' => $provider->priority,
                        'is_enabled' => $provider->is_enabled,
                        'warning_threshold' => $provider->warning_threshold,
                        'critical_threshold' => $provider->critical_threshold,
                        'remaining_quota' => $provider->getRemainingQuota(),
                        'created_at' => $provider->created_at?->toIso8601String(),
                        'updated_at' => $provider->updated_at?->toIso8601String(),
                    ];
                });

            return response()->json([
                'message' => 'Exchange rate providers retrieved successfully',
                'data' => $providers->values()->all(),
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve exchange rate providers', [
                'tenant_id' => auth()->user()->tenant_id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to retrieve exchange rate providers',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Create a new exchange rate provider.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $tenantId = auth()->user()->tenant_id;

            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100',
                'code' => 'required|string|max:50',
                'api_url' => 'required|url|max:255',
                'api_key' => 'nullable|string',
                'requires_api_key' => 'required|boolean',
                'is_unlimited' => 'required|boolean',
                'monthly_quota' => 'required|integer|min:0',
                'priority' => 'required|integer|min:0',
                'is_enabled' => 'boolean',
                'warning_threshold' => 'integer|min:0',
                'critical_threshold' => 'integer|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Check for duplicate name within tenant
            $existingProvider = ExchangeRateProvider::where('tenant_id', $tenantId)
                ->where('name', $request->input('name'))
                ->first();

            if ($existingProvider) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => [
                        'name' => ['A provider with this name already exists'],
                    ],
                ], 422);
            }

            DB::beginTransaction();

            // Create provider
            $provider = new ExchangeRateProvider([
                'tenant_id' => $tenantId,
                'name' => $request->input('name'),
                'code' => $request->input('code'),
                'api_url' => $request->input('api_url'),
                'api_key' => $request->input('api_key'),
                'requires_api_key' => $request->input('requires_api_key'),
                'is_unlimited' => $request->input('is_unlimited'),
                'monthly_quota' => $request->input('monthly_quota'),
                'priority' => $request->input('priority'),
                'is_enabled' => $request->input('is_enabled', true),
                'warning_threshold' => $request->input('warning_threshold', 50),
                'critical_threshold' => $request->input('critical_threshold', 20),
            ]);

            // Validate API key if provided and required
            if ($provider->requires_api_key && !empty($provider->api_key)) {
                try {
                    $this->providerManagementService->validateApiKey($provider);
                } catch (\Exception $e) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'API key validation failed',
                        'errors' => [
                            'api_key' => [$e->getMessage()],
                        ],
                    ], 422);
                }
            }

            $provider->save();

            DB::commit();

            Log::info('Exchange rate provider created successfully', [
                'tenant_id' => $tenantId,
                'provider_uuid' => $provider->uuid,
                'provider_name' => $provider->name,
            ]);

            return response()->json([
                'message' => 'Exchange rate provider created successfully',
                'data' => [
                    'uuid' => $provider->uuid,
                    'name' => $provider->name,
                    'code' => $provider->code,
                    'api_url' => $provider->api_url,
                    'requires_api_key' => $provider->requires_api_key,
                    'has_api_key' => !empty($provider->api_key),
                    'is_unlimited' => $provider->is_unlimited,
                    'monthly_quota' => $provider->monthly_quota,
                    'priority' => $provider->priority,
                    'is_enabled' => $provider->is_enabled,
                    'warning_threshold' => $provider->warning_threshold,
                    'critical_threshold' => $provider->critical_threshold,
                    'created_at' => $provider->created_at?->toIso8601String(),
                    'updated_at' => $provider->updated_at?->toIso8601String(),
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to create exchange rate provider', [
                'tenant_id' => auth()->user()->tenant_id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to create exchange rate provider',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Update an existing exchange rate provider.
     *
     * @param Request $request
     * @param string $uuid
     * @return JsonResponse
     */
    public function update(Request $request, string $uuid): JsonResponse
    {
        try {
            $tenantId = auth()->user()->tenant_id;

            // Validate UUID format
            if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uuid)) {
                return response()->json([
                    'message' => 'Provider not found',
                ], 404);
            }

            // Find provider
            $provider = ExchangeRateProvider::where('uuid', $uuid)
                ->where('tenant_id', $tenantId)
                ->first();

            if (!$provider) {
                return response()->json([
                    'message' => 'Provider not found',
                ], 404);
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:100',
                'code' => 'sometimes|string|max:50',
                'api_url' => 'sometimes|url|max:255',
                'api_key' => 'nullable|string',
                'requires_api_key' => 'sometimes|boolean',
                'is_unlimited' => 'sometimes|boolean',
                'monthly_quota' => 'sometimes|integer|min:0',
                'priority' => 'sometimes|integer|min:0',
                'is_enabled' => 'sometimes|boolean',
                'warning_threshold' => 'sometimes|integer|min:0',
                'critical_threshold' => 'sometimes|integer|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Check for duplicate name if name is being changed
            if ($request->has('name') && $request->input('name') !== $provider->name) {
                $existingProvider = ExchangeRateProvider::where('tenant_id', $tenantId)
                    ->where('name', $request->input('name'))
                    ->where('uuid', '!=', $uuid)
                    ->first();

                if ($existingProvider) {
                    return response()->json([
                        'message' => 'Validation failed',
                        'errors' => [
                            'name' => ['A provider with this name already exists'],
                        ],
                    ], 422);
                }
            }

            DB::beginTransaction();

            // Update provider fields
            if ($request->has('name')) {
                $provider->name = $request->input('name');
            }
            if ($request->has('code')) {
                $provider->code = $request->input('code');
            }
            if ($request->has('api_url')) {
                $provider->api_url = $request->input('api_url');
            }
            if ($request->has('api_key')) {
                $provider->api_key = $request->input('api_key');
            }
            if ($request->has('requires_api_key')) {
                $provider->requires_api_key = $request->input('requires_api_key');
            }
            if ($request->has('is_unlimited')) {
                $provider->is_unlimited = $request->input('is_unlimited');
            }
            if ($request->has('monthly_quota')) {
                $provider->monthly_quota = $request->input('monthly_quota');
            }
            if ($request->has('priority')) {
                $provider->priority = $request->input('priority');
            }
            if ($request->has('is_enabled')) {
                $provider->is_enabled = $request->input('is_enabled');
            }
            if ($request->has('warning_threshold')) {
                $provider->warning_threshold = $request->input('warning_threshold');
            }
            if ($request->has('critical_threshold')) {
                $provider->critical_threshold = $request->input('critical_threshold');
            }

            // Validate API key if it was updated and is required
            if ($request->has('api_key') && $provider->requires_api_key && !empty($provider->api_key)) {
                try {
                    $this->providerManagementService->validateApiKey($provider);
                } catch (\Exception $e) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'API key validation failed',
                        'errors' => [
                            'api_key' => [$e->getMessage()],
                        ],
                    ], 422);
                }
            }

            $provider->save();

            DB::commit();

            Log::info('Exchange rate provider updated successfully', [
                'tenant_id' => $tenantId,
                'provider_uuid' => $provider->uuid,
                'provider_name' => $provider->name,
            ]);

            return response()->json([
                'message' => 'Exchange rate provider updated successfully',
                'data' => [
                    'uuid' => $provider->uuid,
                    'name' => $provider->name,
                    'code' => $provider->code,
                    'api_url' => $provider->api_url,
                    'requires_api_key' => $provider->requires_api_key,
                    'has_api_key' => !empty($provider->api_key),
                    'is_unlimited' => $provider->is_unlimited,
                    'monthly_quota' => $provider->monthly_quota,
                    'priority' => $provider->priority,
                    'is_enabled' => $provider->is_enabled,
                    'warning_threshold' => $provider->warning_threshold,
                    'critical_threshold' => $provider->critical_threshold,
                    'created_at' => $provider->created_at?->toIso8601String(),
                    'updated_at' => $provider->updated_at?->toIso8601String(),
                ],
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to update exchange rate provider', [
                'tenant_id' => auth()->user()->tenant_id ?? null,
                'provider_uuid' => $uuid ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to update exchange rate provider',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Delete an exchange rate provider.
     *
     * @param string $uuid
     * @return JsonResponse
     */
    public function destroy(string $uuid): JsonResponse
    {
        try {
            $tenantId = auth()->user()->tenant_id;

            // Validate UUID format
            if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uuid)) {
                return response()->json([
                    'message' => 'Provider not found',
                ], 404);
            }

            // Find provider
            $provider = ExchangeRateProvider::where('uuid', $uuid)
                ->where('tenant_id', $tenantId)
                ->first();

            if (!$provider) {
                return response()->json([
                    'message' => 'Provider not found',
                ], 404);
            }

            DB::beginTransaction();

            // Check if provider is currently active
            $settings = \App\Models\ExchangeRateSetting::where('tenant_id', $tenantId)
                ->where('active_provider_id', $provider->id)
                ->first();

            if ($settings) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Cannot delete active provider',
                    'errors' => [
                        'provider' => ['This provider is currently active and cannot be deleted. Please select a different active provider first.'],
                    ],
                ], 422);
            }

            $providerName = $provider->name;
            $provider->delete();

            DB::commit();

            Log::info('Exchange rate provider deleted successfully', [
                'tenant_id' => $tenantId,
                'provider_uuid' => $uuid,
                'provider_name' => $providerName,
            ]);

            return response()->json([
                'message' => 'Exchange rate provider deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to delete exchange rate provider', [
                'tenant_id' => auth()->user()->tenant_id ?? null,
                'provider_uuid' => $uuid ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to delete exchange rate provider',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get quota status for all providers.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function quotaStatus(Request $request): JsonResponse
    {
        try {
            $tenantId = auth()->user()->tenant_id;

            $quotaStatuses = $this->quotaManagementService->getQuotaStatus($tenantId);

            return response()->json([
                'message' => 'Quota status retrieved successfully',
                'data' => $quotaStatuses,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve quota status', [
                'tenant_id' => auth()->user()->tenant_id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to retrieve quota status',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }
}
