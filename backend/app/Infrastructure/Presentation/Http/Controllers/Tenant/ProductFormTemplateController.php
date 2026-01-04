<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\ProductFormTemplate;
use App\Models\ProductFormConfiguration;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Presentation\Http\Requests\ProductForm\StoreFormTemplateRequest;
use App\Infrastructure\Presentation\Http\Requests\ProductForm\UpdateFormTemplateRequest;
use App\Infrastructure\Presentation\Http\Requests\ProductForm\ApplyTemplateRequest;
use App\Infrastructure\Presentation\Http\Resources\ProductForm\FormTemplateResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ProductFormTemplateController extends Controller
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
     * List all available form templates
     * GET /api/tenant/form-templates
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant context tidak tersedia',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 500);
            }

            $perPage = $request->get('per_page', 20);
            $perPage = min($perPage, 50);

            $query = ProductFormTemplate::query()
                ->where(function ($q) use ($tenant) {
                    $q->whereNull('tenant_id')
                      ->orWhere('tenant_id', $tenant->uuid);
                });

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('description', 'LIKE', "%{$search}%");
                });
            }

            if ($request->filled('category')) {
                $query->where('category', $request->category);
            }

            if ($request->has('is_system')) {
                $query->where('is_system', $request->boolean('is_system'));
            }

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            $allowedSortFields = ['name', 'created_at', 'usage_count'];
            if (!in_array($sortBy, $allowedSortFields)) {
                $sortBy = 'created_at';
            }

            $query->orderBy($sortBy, $sortOrder);

            $templates = $query->paginate($perPage);

            return response()->json([
                'data' => FormTemplateResource::collection($templates),
                'meta' => [
                    'current_page' => $templates->currentPage(),
                    'total' => $templates->total(),
                    'per_page' => $templates->perPage(),
                    'last_page' => $templates->lastPage(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('[FormTemplate] Error retrieving templates', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat mengambil template list',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get specific template details with full schema
     * GET /api/tenant/form-templates/{uuid}
     */
    public function show(Request $request, string $uuid): JsonResponse
    {
        try {
            if ($error = $this->validateUuid($uuid)) {
                return $error;
            }

            $tenant = $this->resolveTenant($request);
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant context tidak tersedia',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 500);
            }

            $template = ProductFormTemplate::where('uuid', $uuid)
                ->where(function ($q) use ($tenant) {
                    $q->whereNull('tenant_id')
                      ->orWhere('tenant_id', $tenant->uuid);
                })
                ->first();

            if (!$template) {
                return response()->json([
                    'message' => 'Template tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'data' => new FormTemplateResource($template)
            ]);

        } catch (\Exception $e) {
            Log::error('[FormTemplate] Error retrieving template', [
                'uuid' => $uuid,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat mengambil template',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Create custom template
     * POST /api/tenant/form-templates
     */
    public function store(StoreFormTemplateRequest $request): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant context tidak tersedia',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 500);
            }

            $template = ProductFormTemplate::create([
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $tenant->uuid,
                'name' => $request->name,
                'description' => $request->description,
                'category' => $request->category,
                'form_schema' => $request->form_schema,
                'validation_rules' => $request->validation_rules,
                'conditional_logic' => $request->conditional_logic,
                'is_public' => $request->input('is_public', false),
                'is_system' => false,
                'preview_image_url' => $request->preview_image_url,
                'tags' => $request->tags ?? [],
                'created_by' => auth()->id(),
            ]);

            return response()->json([
                'message' => 'Template berhasil dibuat',
                'data' => new FormTemplateResource($template)
            ], 201);

        } catch (\Exception $e) {
            Log::error('[FormTemplate] Error creating template', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat membuat template',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Update existing template
     * PUT /api/tenant/form-templates/{uuid}
     */
    public function update(UpdateFormTemplateRequest $request, string $uuid): JsonResponse
    {
        try {
            if ($error = $this->validateUuid($uuid)) {
                return $error;
            }

            $tenant = $this->resolveTenant($request);
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant context tidak tersedia',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 500);
            }

            $template = ProductFormTemplate::where('uuid', $uuid)
                ->where('tenant_id', $tenant->uuid)
                ->first();

            if (!$template) {
                return response()->json([
                    'message' => 'Template tidak ditemukan atau Anda tidak memiliki akses'
                ], 404);
            }

            if ($template->is_system) {
                return response()->json([
                    'message' => 'System template tidak dapat diubah'
                ], 403);
            }

            $template->update([
                'name' => $request->input('name', $template->name),
                'description' => $request->input('description', $template->description),
                'category' => $request->input('category', $template->category),
                'form_schema' => $request->input('form_schema', $template->form_schema),
                'validation_rules' => $request->input('validation_rules', $template->validation_rules),
                'conditional_logic' => $request->input('conditional_logic', $template->conditional_logic),
                'is_public' => $request->input('is_public', $template->is_public),
                'preview_image_url' => $request->input('preview_image_url', $template->preview_image_url),
                'tags' => $request->input('tags', $template->tags),
                'updated_by' => auth()->id(),
            ]);

            return response()->json([
                'message' => 'Template berhasil diupdate',
                'data' => new FormTemplateResource($template->fresh())
            ]);

        } catch (\Exception $e) {
            Log::error('[FormTemplate] Error updating template', [
                'uuid' => $uuid,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat mengupdate template',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Delete template
     * DELETE /api/tenant/form-templates/{uuid}
     */
    public function destroy(Request $request, string $uuid): JsonResponse
    {
        try {
            if ($error = $this->validateUuid($uuid)) {
                return $error;
            }

            $tenant = $this->resolveTenant($request);
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant context tidak tersedia',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 500);
            }

            $template = ProductFormTemplate::where('uuid', $uuid)
                ->where('tenant_id', $tenant->uuid)
                ->first();

            if (!$template) {
                return response()->json([
                    'message' => 'Template tidak ditemukan atau Anda tidak memiliki akses'
                ], 404);
            }

            if ($template->is_system) {
                return response()->json([
                    'message' => 'System template tidak dapat dihapus'
                ], 403);
            }

            $template->delete();

            return response()->json([
                'message' => 'Template berhasil dihapus'
            ], 204);

        } catch (\Exception $e) {
            Log::error('[FormTemplate] Error deleting template', [
                'uuid' => $uuid,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat menghapus template',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Apply template to product(s)
     * POST /api/tenant/form-templates/{uuid}/apply
     */
    public function apply(ApplyTemplateRequest $request, string $uuid): JsonResponse
    {
        try {
            if ($error = $this->validateUuid($uuid)) {
                return $error;
            }

            $tenant = $this->resolveTenant($request);
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant context tidak tersedia',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 500);
            }

            $template = ProductFormTemplate::where('uuid', $uuid)
                ->where(function ($q) use ($tenant) {
                    $q->whereNull('tenant_id')
                      ->orWhere('tenant_id', $tenant->uuid);
                })
                ->first();

            if (!$template) {
                return response()->json([
                    'message' => 'Template tidak ditemukan'
                ], 404);
            }

            return DB::transaction(function () use ($request, $template, $tenant) {
                $productUuids = $request->product_uuids;
                $overwriteExisting = $request->input('overwrite_existing', false);

                $results = [];
                $appliedCount = 0;
                $skippedCount = 0;

                foreach ($productUuids as $productUuid) {
                    $product = Product::where('uuid', $productUuid)
                        ->where('tenant_id', $tenant->id)
                        ->first();

                    if (!$product) {
                        $results[] = [
                            'product_uuid' => $productUuid,
                            'status' => 'skipped',
                            'reason' => 'Product not found'
                        ];
                        $skippedCount++;
                        continue;
                    }

                    $existingConfig = ProductFormConfiguration::where('product_id', $product->id)
                        ->where('tenant_id', $tenant->uuid)
                        ->where('is_active', true)
                        ->first();

                    if ($existingConfig && !$overwriteExisting) {
                        $results[] = [
                            'product_uuid' => $productUuid,
                            'status' => 'skipped',
                            'reason' => 'Configuration already exists'
                        ];
                        $skippedCount++;
                        continue;
                    }

                    if ($existingConfig) {
                        $existingConfig->update(['is_active' => false]);
                    }

                    ProductFormConfiguration::create([
                        'uuid' => Str::uuid()->toString(),
                        'tenant_id' => $tenant->uuid,
                        'product_id' => $product->id,
                        'product_uuid' => $product->uuid,
                        'name' => $template->name,
                        'description' => $template->description,
                        'form_schema' => $template->form_schema,
                        'validation_rules' => $template->validation_rules,
                        'conditional_logic' => $template->conditional_logic,
                        'is_active' => true,
                        'template_id' => $template->id,
                        'version' => 1,
                        'created_by' => auth()->id(),
                    ]);

                    Cache::forget("product_form_config:{$productUuid}");

                    $results[] = [
                        'product_uuid' => $productUuid,
                        'status' => 'success'
                    ];
                    $appliedCount++;
                }

                $template->increment('usage_count', $appliedCount);

                return response()->json([
                    'message' => "Template berhasil diterapkan ke {$appliedCount} produk",
                    'data' => [
                        'applied_count' => $appliedCount,
                        'skipped_count' => $skippedCount,
                        'results' => $results
                    ]
                ]);
            });

        } catch (\Exception $e) {
            Log::error('[FormTemplate] Error applying template', [
                'uuid' => $uuid,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat menerapkan template',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
