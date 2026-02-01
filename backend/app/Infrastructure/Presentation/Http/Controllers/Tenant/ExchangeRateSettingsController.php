<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\ExchangeRateSetting;
use App\Models\ExchangeRateProvider;
use App\Infrastructure\Presentation\Http\Requests\ExchangeRate\UpdateExchangeRateSettingsRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExchangeRateSettingsController extends Controller
{
    /**
     * Get current exchange rate settings for the authenticated tenant.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $tenantId = auth()->user()->tenant_id;

            // Get or create settings for tenant
            $settings = ExchangeRateSetting::with('activeProvider')
                ->where('tenant_id', $tenantId)
                ->first();

            if (!$settings) {
                // Create default settings if none exist
                $settings = ExchangeRateSetting::create([
                    'tenant_id' => $tenantId,
                    'mode' => 'manual',
                    'manual_rate' => null,
                    'current_rate' => null,
                    'active_provider_id' => null,
                    'auto_update_enabled' => true,
                    'auto_update_time' => '00:00:00',
                ]);

                $settings->load('activeProvider');
            }

            return response()->json([
                'message' => 'Exchange rate settings retrieved successfully',
                'data' => [
                    'uuid' => $settings->uuid,
                    'mode' => $settings->mode,
                    'manual_rate' => $settings->manual_rate,
                    'current_rate' => $settings->current_rate,
                    'active_provider_id' => $settings->activeProvider?->uuid,
                    'active_provider' => $settings->activeProvider ? [
                        'uuid' => $settings->activeProvider->uuid,
                        'name' => $settings->activeProvider->name,
                        'is_enabled' => $settings->activeProvider->is_enabled,
                        'priority' => $settings->activeProvider->priority,
                    ] : null,
                    'auto_update_enabled' => $settings->auto_update_enabled,
                    'auto_update_time' => $settings->auto_update_time,
                    'last_updated_at' => $settings->last_updated_at?->toIso8601String(),
                    'created_at' => $settings->created_at?->toIso8601String(),
                    'updated_at' => $settings->updated_at?->toIso8601String(),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve exchange rate settings', [
                'tenant_id' => auth()->user()->tenant_id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to retrieve exchange rate settings',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Update exchange rate settings for the authenticated tenant.
     *
     * @param UpdateExchangeRateSettingsRequest $request
     * @return JsonResponse
     */
    public function update(UpdateExchangeRateSettingsRequest $request): JsonResponse
    {
        try {
            $tenantId = auth()->user()->tenant_id;

            DB::beginTransaction();

            // Get or create settings for tenant
            $settings = ExchangeRateSetting::where('tenant_id', $tenantId)->first();

            if (!$settings) {
                $settings = new ExchangeRateSetting([
                    'tenant_id' => $tenantId,
                ]);
            }

            // Update mode
            $settings->mode = $request->input('mode');

            // Handle manual mode
            if ($request->input('mode') === 'manual') {
                $settings->manual_rate = $request->input('manual_rate');
                $settings->current_rate = $request->input('manual_rate');
                
                // Clear active provider in manual mode (optional)
                // $settings->active_provider_id = null;
            }

            // Handle auto mode
            if ($request->input('mode') === 'auto') {
                // Validate and set active provider
                if ($request->has('active_provider_id')) {
                    $provider = ExchangeRateProvider::where('uuid', $request->input('active_provider_id'))
                        ->where('tenant_id', $tenantId)
                        ->where('is_enabled', true)
                        ->first();

                    if (!$provider) {
                        DB::rollBack();
                        return response()->json([
                            'message' => 'Selected provider is not available or not enabled',
                            'errors' => [
                                'active_provider_id' => ['The selected provider is not available or not enabled'],
                            ],
                        ], 422);
                    }

                    // Use internal ID, not UUID
                    $settings->active_provider_id = $provider->id;
                }

                // Clear manual rate in auto mode (optional)
                // $settings->manual_rate = null;
            }

            // Update optional fields
            if ($request->has('auto_update_enabled')) {
                $settings->auto_update_enabled = $request->input('auto_update_enabled');
            }

            if ($request->has('auto_update_time')) {
                $settings->auto_update_time = $request->input('auto_update_time');
            }

            // Update last_updated_at timestamp
            $settings->last_updated_at = now();

            $settings->save();

            DB::commit();

            // Reload with relationships
            $settings->load('activeProvider');

            Log::info('Exchange rate settings updated successfully', [
                'tenant_id' => $tenantId,
                'mode' => $settings->mode,
                'manual_rate' => $settings->manual_rate,
                'active_provider_id' => $settings->active_provider_id,
            ]);

            return response()->json([
                'message' => 'Exchange rate settings updated successfully',
                'data' => [
                    'uuid' => $settings->uuid,
                    'mode' => $settings->mode,
                    'manual_rate' => $settings->manual_rate,
                    'current_rate' => $settings->current_rate,
                    'active_provider_id' => $settings->activeProvider?->uuid,
                    'active_provider' => $settings->activeProvider ? [
                        'uuid' => $settings->activeProvider->uuid,
                        'name' => $settings->activeProvider->name,
                        'is_enabled' => $settings->activeProvider->is_enabled,
                        'priority' => $settings->activeProvider->priority,
                    ] : null,
                    'auto_update_enabled' => $settings->auto_update_enabled,
                    'auto_update_time' => $settings->auto_update_time,
                    'last_updated_at' => $settings->last_updated_at?->toIso8601String(),
                    'created_at' => $settings->created_at?->toIso8601String(),
                    'updated_at' => $settings->updated_at?->toIso8601String(),
                ],
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to update exchange rate settings', [
                'tenant_id' => auth()->user()->tenant_id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to update exchange rate settings',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }
}
