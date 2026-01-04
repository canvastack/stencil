<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\ProductFormConfiguration;
use App\Models\ProductFormTemplate;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Presentation\Http\Requests\ProductForm\StoreFormConfigurationRequest;
use App\Infrastructure\Presentation\Http\Requests\ProductForm\UpdateFormConfigurationRequest;
use App\Infrastructure\Presentation\Http\Resources\ProductForm\FormConfigurationResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ProductFormConfigurationController extends Controller
{
    /**
     * Resolve tenant dari berbagai sources dengan fallback
     */
    private function resolveTenant(Request $request)
    {
        $tenant = $request->attributes->get('tenant');
        if ($tenant) {
            return $tenant;
        }
        
        $tenant = $request->get('current_tenant');
        if ($tenant) {
            return $tenant;
        }
        
        if (app()->bound('current_tenant')) {
            $tenant = app('current_tenant');
            if ($tenant) {
                return $tenant;
            }
        }
        
        $tenant = config('multitenancy.current_tenant');
        if ($tenant) {
            return $tenant;
        }
        
        $user = auth('sanctum')->user() ?? auth()->user();
        if ($user && isset($user->tenant_id)) {
            $tenant = $user->tenant ?? \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::find($user->tenant_id);
            if ($tenant) {
                $request->attributes->set('tenant', $tenant);
                $request->merge(['current_tenant' => $tenant]);
                return $tenant;
            }
        }
        
        return null;
    }

    /**
     * Validate UUID format
     */
    private function validateUuid(string $id): ?JsonResponse
    {
        if (!Str::isUuid($id)) {
            return response()->json([
                'message' => 'Format UUID tidak valid',
                'received' => $id
            ], 400);
        }
        return null;
    }

    /**
     * Get form configuration for specific product
     * GET /api/tenant/products/{uuid}/form-configuration
     */
    public function show(Request $request, string $productUuid): JsonResponse
    {
        try {
            if ($error = $this->validateUuid($productUuid)) {
                return $error;
            }

            $tenant = $this->resolveTenant($request);
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant context tidak tersedia',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 500);
            }

            $product = Product::where('uuid', $productUuid)
                ->where('tenant_id', $tenant->id)
                ->first();

            if (!$product) {
                return response()->json([
                    'message' => 'Produk tidak ditemukan'
                ], 404);
            }

            $configuration = ProductFormConfiguration::where('product_id', $product->id)
                ->where('tenant_id', $tenant->uuid)
                ->where('is_active', true)
                ->with(['template', 'product'])
                ->first();

            if (!$configuration) {
                return response()->json([
                    'message' => 'Form configuration tidak ditemukan untuk produk ini',
                    'suggestion' => 'Gunakan default template atau buat configuration baru'
                ], 404);
            }

            return response()->json([
                'data' => new FormConfigurationResource($configuration)
            ]);

        } catch (\Exception $e) {
            Log::error('[FormConfig] Error retrieving form configuration', [
                'product_uuid' => $productUuid,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat mengambil form configuration',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Create or update form configuration for product
     * POST /api/tenant/products/{uuid}/form-configuration
     */
    public function store(StoreFormConfigurationRequest $request, string $productUuid): JsonResponse
    {
        try {
            if ($error = $this->validateUuid($productUuid)) {
                return $error;
            }

            $tenant = $this->resolveTenant($request);
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant context tidak tersedia',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 500);
            }

            $product = Product::where('uuid', $productUuid)
                ->where('tenant_id', $tenant->id)
                ->first();

            if (!$product) {
                return response()->json([
                    'message' => 'Produk tidak ditemukan'
                ], 404);
            }

            return DB::transaction(function () use ($request, $product, $tenant) {
                $existingConfig = ProductFormConfiguration::where('product_id', $product->id)
                    ->where('tenant_id', $tenant->uuid)
                    ->where('is_active', true)
                    ->first();

                if ($existingConfig) {
                    $existingConfig->update([
                        'is_active' => false
                    ]);
                }

                $configuration = ProductFormConfiguration::create([
                    'uuid' => Str::uuid()->toString(),
                    'tenant_id' => $tenant->uuid,
                    'product_id' => $product->id,
                    'product_uuid' => $product->uuid,
                    'name' => $request->input('name', 'Order Form'),
                    'description' => $request->input('description'),
                    'form_schema' => $request->input('form_schema'),
                    'validation_rules' => $request->input('validation_rules'),
                    'conditional_logic' => $request->input('conditional_logic'),
                    'is_active' => true,
                    'is_default' => $request->input('is_default', false),
                    'template_id' => $request->input('template_id'),
                    'version' => 1,
                    'created_by' => auth()->id(),
                ]);

                $this->clearFormConfigurationCache($product->uuid);

                return response()->json([
                    'message' => 'Form configuration berhasil dibuat',
                    'data' => new FormConfigurationResource($configuration->fresh(['template', 'product']))
                ], 201);
            });

        } catch (\Exception $e) {
            Log::error('[FormConfig] Error creating form configuration', [
                'product_uuid' => $productUuid,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat membuat form configuration',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Update existing form configuration
     * PUT /api/tenant/products/{uuid}/form-configuration
     */
    public function update(UpdateFormConfigurationRequest $request, string $productUuid): JsonResponse
    {
        try {
            if ($error = $this->validateUuid($productUuid)) {
                return $error;
            }

            $tenant = $this->resolveTenant($request);
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant context tidak tersedia',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 500);
            }

            $product = Product::where('uuid', $productUuid)
                ->where('tenant_id', $tenant->id)
                ->first();

            if (!$product) {
                return response()->json([
                    'message' => 'Produk tidak ditemukan'
                ], 404);
            }

            $configuration = ProductFormConfiguration::where('product_id', $product->id)
                ->where('tenant_id', $tenant->uuid)
                ->where('is_active', true)
                ->first();

            if (!$configuration) {
                return response()->json([
                    'message' => 'Form configuration tidak ditemukan'
                ], 404);
            }

            return DB::transaction(function () use ($request, $configuration, $product) {
                $configuration->update([
                    'name' => $request->input('name', $configuration->name),
                    'description' => $request->input('description', $configuration->description),
                    'form_schema' => $request->input('form_schema', $configuration->form_schema),
                    'validation_rules' => $request->input('validation_rules', $configuration->validation_rules),
                    'conditional_logic' => $request->input('conditional_logic', $configuration->conditional_logic),
                    'is_active' => $request->input('is_active', $configuration->is_active),
                    'version' => $configuration->version + 1,
                    'updated_by' => auth()->id(),
                ]);

                $this->clearFormConfigurationCache($product->uuid);

                return response()->json([
                    'message' => 'Form configuration berhasil diupdate',
                    'data' => new FormConfigurationResource($configuration->fresh(['template', 'product']))
                ]);
            });

        } catch (\Exception $e) {
            Log::error('[FormConfig] Error updating form configuration', [
                'product_uuid' => $productUuid,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat mengupdate form configuration',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Delete form configuration (revert to default)
     * DELETE /api/tenant/products/{uuid}/form-configuration
     */
    public function destroy(Request $request, string $productUuid): JsonResponse
    {
        try {
            if ($error = $this->validateUuid($productUuid)) {
                return $error;
            }

            $tenant = $this->resolveTenant($request);
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant context tidak tersedia',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 500);
            }

            $product = Product::where('uuid', $productUuid)
                ->where('tenant_id', $tenant->id)
                ->first();

            if (!$product) {
                return response()->json([
                    'message' => 'Produk tidak ditemukan'
                ], 404);
            }

            $configuration = ProductFormConfiguration::where('product_id', $product->id)
                ->where('tenant_id', $tenant->uuid)
                ->where('is_active', true)
                ->first();

            if (!$configuration) {
                return response()->json([
                    'message' => 'Form configuration tidak ditemukan'
                ], 404);
            }

            $configuration->delete();

            $this->clearFormConfigurationCache($product->uuid);

            return response()->json([
                'message' => 'Form configuration berhasil dihapus'
            ], 204);

        } catch (\Exception $e) {
            Log::error('[FormConfig] Error deleting form configuration', [
                'product_uuid' => $productUuid,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat menghapus form configuration',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Duplicate form configuration from another product
     * POST /api/tenant/products/{uuid}/form-configuration/duplicate
     */
    public function duplicate(Request $request, string $productUuid): JsonResponse
    {
        try {
            $request->validate([
                'source_product_uuid' => 'required|uuid',
                'is_active' => 'boolean'
            ]);

            if ($error = $this->validateUuid($productUuid)) {
                return $error;
            }

            $tenant = $this->resolveTenant($request);
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant context tidak tersedia',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 500);
            }

            $targetProduct = Product::where('uuid', $productUuid)
                ->where('tenant_id', $tenant->id)
                ->first();

            if (!$targetProduct) {
                return response()->json([
                    'message' => 'Target product tidak ditemukan'
                ], 404);
            }

            $sourceProduct = Product::where('uuid', $request->source_product_uuid)
                ->where('tenant_id', $tenant->id)
                ->first();

            if (!$sourceProduct) {
                return response()->json([
                    'message' => 'Source product tidak ditemukan'
                ], 404);
            }

            $sourceConfig = ProductFormConfiguration::where('product_id', $sourceProduct->id)
                ->where('tenant_id', $tenant->uuid)
                ->where('is_active', true)
                ->first();

            if (!$sourceConfig) {
                return response()->json([
                    'message' => 'Source product tidak memiliki form configuration'
                ], 404);
            }

            return DB::transaction(function () use ($request, $targetProduct, $sourceConfig, $tenant) {
                $existingConfig = ProductFormConfiguration::where('product_id', $targetProduct->id)
                    ->where('tenant_id', $tenant->uuid)
                    ->where('is_active', true)
                    ->first();

                if ($existingConfig) {
                    $existingConfig->update(['is_active' => false]);
                }

                $newConfig = ProductFormConfiguration::create([
                    'uuid' => Str::uuid()->toString(),
                    'tenant_id' => $tenant->uuid,
                    'product_id' => $targetProduct->id,
                    'product_uuid' => $targetProduct->uuid,
                    'name' => $sourceConfig->name,
                    'description' => $sourceConfig->description,
                    'form_schema' => $sourceConfig->form_schema,
                    'validation_rules' => $sourceConfig->validation_rules,
                    'conditional_logic' => $sourceConfig->conditional_logic,
                    'is_active' => $request->input('is_active', true),
                    'template_id' => $sourceConfig->template_id,
                    'version' => 1,
                    'created_by' => auth()->id(),
                ]);

                $this->clearFormConfigurationCache($targetProduct->uuid);

                return response()->json([
                    'message' => 'Form configuration berhasil diduplikasi',
                    'data' => new FormConfigurationResource($newConfig->fresh(['template', 'product']))
                ], 201);
            });

        } catch (\Exception $e) {
            Log::error('[FormConfig] Error duplicating form configuration', [
                'product_uuid' => $productUuid,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat menduplikasi form configuration',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Clear cache untuk form configuration
     */
    private function clearFormConfigurationCache(string $productUuid): void
    {
        Cache::forget("product_form_config:{$productUuid}");
        Cache::forget("public:product_form_config:{$productUuid}");
    }
}
