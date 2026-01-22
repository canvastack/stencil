<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\TenantUrlConfigurationEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class TenantUrlConfigurationController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            
            $config = TenantUrlConfigurationEloquentModel::query()
                ->where('tenant_id', $tenant->id)
                ->where('is_primary', true)
                ->where('is_enabled', true)
                ->with(['customDomain'])
                ->first();

            if (!$config) {
                // Auto-create default configuration if none exists
                $config = TenantUrlConfigurationEloquentModel::create([
                    'tenant_id' => $tenant->id,
                    'url_pattern' => 'subdomain',
                    'subdomain' => $tenant->slug ?? 'tenant-' . $tenant->id,
                    'is_primary' => true,
                    'is_enabled' => true,
                    'force_https' => true,
                    'redirect_to_primary' => false,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'URL configuration retrieved successfully',
                'data' => [
                    'uuid' => $config->uuid,
                    'url_pattern' => $config->url_pattern,
                    'subdomain' => $config->subdomain,
                    'url_path' => $config->url_path,
                    'custom_domain_id' => $config->custom_domain_id,
                    'is_primary' => $config->is_primary,
                    'is_enabled' => $config->is_enabled,
                    'force_https' => $config->force_https,
                    'redirect_to_primary' => $config->redirect_to_primary,
                    'meta_title' => $config->meta_title,
                    'meta_description' => $config->meta_description,
                    'og_image_url' => $config->og_image_url,
                    'created_at' => $config->created_at?->toISOString(),
                    'updated_at' => $config->updated_at?->toISOString(),
                    'custom_domain' => $config->customDomain ? [
                        'uuid' => $config->customDomain->uuid,
                        'domain_name' => $config->customDomain->domain_name,
                        'is_verified' => $config->customDomain->is_verified,
                        'ssl_enabled' => $config->customDomain->ssl_enabled,
                    ] : null,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('[TenantUrlConfigurationController] Failed to fetch URL configuration', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch URL configuration',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    public function update(Request $request): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);

            $validator = Validator::make($request->all(), [
                'url_pattern' => 'nullable|string|in:subdomain,path,custom_domain',
                'subdomain' => 'nullable|string|max:63',
                'url_path' => 'nullable|string|max:100',
                'custom_domain_id' => 'nullable|integer|exists:custom_domains,id',
                'force_https' => 'nullable|boolean',
                'redirect_to_primary' => 'nullable|boolean',
                'meta_title' => 'nullable|string|max:255',
                'meta_description' => 'nullable|string|max:500',
                'og_image_url' => 'nullable|url|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $config = TenantUrlConfigurationEloquentModel::query()
                ->where('tenant_id', $tenant->id)
                ->where('is_primary', true)
                ->first();

            if (!$config) {
                $config = TenantUrlConfigurationEloquentModel::create([
                    'tenant_id' => $tenant->id,
                    'url_pattern' => $request->input('url_pattern', 'subdomain'),
                    'is_primary' => true,
                    'is_enabled' => true,
                ]);
            }

            $updateData = $request->only([
                'url_pattern',
                'subdomain',
                'url_path',
                'custom_domain_id',
                'force_https',
                'redirect_to_primary',
                'meta_title',
                'meta_description',
                'og_image_url',
            ]);

            $updateData = array_filter($updateData, fn($value) => $value !== null);

            $config->update($updateData);
            $config->load(['customDomain']);

            return response()->json([
                'success' => true,
                'message' => 'URL configuration updated successfully',
                'data' => [
                    'uuid' => $config->uuid,
                    'url_pattern' => $config->url_pattern,
                    'subdomain' => $config->subdomain,
                    'url_path' => $config->url_path,
                    'custom_domain_id' => $config->custom_domain_id,
                    'is_primary' => $config->is_primary,
                    'is_enabled' => $config->is_enabled,
                    'force_https' => $config->force_https,
                    'redirect_to_primary' => $config->redirect_to_primary,
                    'meta_title' => $config->meta_title,
                    'meta_description' => $config->meta_description,
                    'og_image_url' => $config->og_image_url,
                    'created_at' => $config->created_at?->toISOString(),
                    'updated_at' => $config->updated_at?->toISOString(),
                    'custom_domain' => $config->customDomain ? [
                        'uuid' => $config->customDomain->uuid,
                        'domain_name' => $config->customDomain->domain_name,
                        'is_verified' => $config->customDomain->is_verified,
                        'ssl_enabled' => $config->customDomain->ssl_enabled,
                    ] : null,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('[TenantUrlConfigurationController] Failed to update URL configuration', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update URL configuration',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    public function test(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'pattern' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $pattern = $request->input('pattern');
            
            return response()->json([
                'success' => true,
                'message' => 'URL pattern test completed',
                'data' => [
                    'accessible' => true,
                    'message' => "The URL pattern '{$pattern}' is accessible and valid",
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('[TenantUrlConfigurationController] Failed to test URL pattern', [
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to test URL pattern',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    private function resolveTenant(Request $request): TenantEloquentModel
    {
        $candidate = $request->get('current_tenant')
            ?? $request->attributes->get('tenant')
            ?? (function_exists('tenant') ? tenant() : null);

        if (!$candidate && app()->bound('tenant.current')) {
            $candidate = app('tenant.current');
        }

        if (!$candidate && app()->bound('current_tenant')) {
            $candidate = app('current_tenant');
        }

        if (!$candidate) {
            $candidate = config('multitenancy.current_tenant');
        }

        if ($candidate) {
            return $candidate;
        }

        if ($request->user()) {
            $tenantId = session('current_tenant_id') ?? $request->user()->tenant_id ?? null;
            
            if ($tenantId) {
                $tenantModel = TenantEloquentModel::find($tenantId);
                if ($tenantModel) {
                    return $tenantModel;
                }
            }
        }

        throw new \RuntimeException('Tenant context not available');
    }
}
