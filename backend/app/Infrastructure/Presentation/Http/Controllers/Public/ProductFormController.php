<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\ProductFormConfiguration;
use App\Models\ProductFormSubmission;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ProductFormController extends Controller
{
    /**
     * Get form configuration for public product page
     * GET /api/public/products/{uuid}/form-configuration
     * 
     * Cached for 24 hours, CDN cacheable for 6 hours
     */
    public function show(Request $request, string $productUuid): JsonResponse
    {
        try {
            if (!Str::isUuid($productUuid)) {
                return response()->json([
                    'message' => 'Format UUID produk tidak valid',
                    'error' => 'INVALID_UUID'
                ], 400);
            }

            // TEMPORARY: Disable cache for testing
            // $cacheKey = "public:product_form_config:{$productUuid}";
            // $formConfig = Cache::remember($cacheKey, now()->addHours(24), function () use ($productUuid) {
            
            $product = Product::where('uuid', $productUuid)
                ->where('status', 'published')
                ->first();

            if (!$product) {
                return response()->json([
                    'message' => 'Produk tidak ditemukan atau tidak tersedia',
                    'error' => 'PRODUCT_NOT_FOUND'
                ], 404);
            }

            $configuration = ProductFormConfiguration::where('product_id', $product->id)
                ->where('is_active', true)
                ->first();

            if (!$configuration) {
                return response()->json([
                    'message' => 'Form configuration tidak tersedia untuk produk ini',
                    'error' => 'FORM_CONFIG_NOT_FOUND'
                ], 404);
            }

            $formConfig = [
                'product_uuid' => $product->uuid,
                'product_name' => $product->name,
                'form_schema' => $configuration->form_schema,
                'conditional_logic' => $configuration->conditional_logic,
                'version' => $configuration->version,
            ];
            
            // });

            if (!$formConfig) {
                return response()->json([
                    'message' => 'Form configuration tidak tersedia untuk produk ini',
                    'error' => 'FORM_CONFIG_NOT_FOUND'
                ], 404);
            }

            return response()->json([
                'data' => $formConfig
            ])
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0')
            ->header('ETag', md5(json_encode($formConfig)));

        } catch (\Exception $e) {
            Log::error('[PublicFormConfig] Error retrieving form configuration', [
                'product_uuid' => $productUuid,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat mengambil form configuration',
                'error' => 'INTERNAL_SERVER_ERROR'
            ], 500);
        }
    }

    /**
     * Submit order form from public page
     * POST /api/public/products/{uuid}/form-submission
     * 
     * This endpoint creates order and logs form submission for analytics
     */
    public function submit(Request $request, string $productUuid): JsonResponse
    {
        try {
            if (!Str::isUuid($productUuid)) {
                return response()->json([
                    'message' => 'Format UUID produk tidak valid',
                    'error' => 'INVALID_UUID'
                ], 400);
            }

            $product = Product::where('uuid', $productUuid)
                ->where('status', 'published')
                ->first();

            if (!$product) {
                return response()->json([
                    'message' => 'Produk tidak ditemukan atau tidak tersedia',
                    'error' => 'PRODUCT_NOT_FOUND'
                ], 404);
            }

            $configuration = ProductFormConfiguration::where('product_id', $product->id)
                ->where('is_active', true)
                ->first();

            if (!$configuration) {
                return response()->json([
                    'message' => 'Form configuration tidak tersedia',
                    'error' => 'FORM_CONFIG_NOT_FOUND'
                ], 404);
            }

            $validationRules = $this->buildValidationRules($configuration->form_schema);
            $validator = Validator::make($request->all(), $validationRules);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validasi form gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            return DB::transaction(function () use ($request, $product, $configuration) {
                $startedAt = $request->input('_form_started_at');
                $completionTime = $startedAt ? now()->diffInSeconds($startedAt) : null;

                $customerData = $this->extractCustomerData($request->all());
                $customer = null;

                if (!empty($customerData)) {
                    $customer = Customer::where('tenant_id', $product->tenant_id)
                        ->where('email', $customerData['email'] ?? '')
                        ->first();

                    if (!$customer && isset($customerData['email'])) {
                        $customer = Customer::create(array_merge($customerData, [
                            'uuid' => Str::uuid()->toString(),
                            'tenant_id' => $product->tenant_id,
                        ]));
                    }
                }

                $submission = ProductFormSubmission::create([
                    'uuid' => Str::uuid()->toString(),
                    'tenant_id' => $product->tenant->uuid ?? null,
                    'product_id' => $product->id,
                    'product_uuid' => $product->uuid,
                    'form_configuration_id' => $configuration->id,
                    'form_configuration_uuid' => $configuration->uuid,
                    'customer_id' => $customer?->id,
                    'customer_uuid' => $customer?->uuid,
                    'submission_data' => $request->except(['_form_started_at', '_token']),
                    'user_agent' => $request->header('User-Agent'),
                    'ip_address' => $request->ip(),
                    'referrer' => $request->header('Referer'),
                    'completion_time' => $completionTime,
                    'is_completed' => true,
                    'started_at' => $startedAt ? now()->parse($startedAt) : now(),
                    'submitted_at' => now(),
                ]);

                $configuration->increment('submission_count');
                
                if ($completionTime) {
                    $avgTime = ProductFormSubmission::where('form_configuration_id', $configuration->id)
                        ->whereNotNull('completion_time')
                        ->avg('completion_time');
                    
                    $configuration->update(['avg_completion_time' => $avgTime]);
                }

                return response()->json([
                    'message' => 'Form berhasil disubmit',
                    'data' => [
                        'submission_uuid' => $submission->uuid,
                        'product_uuid' => $product->uuid,
                        'customer_uuid' => $customer?->uuid,
                        'submitted_at' => $submission->submitted_at->toIso8601String(),
                    ]
                ], 201);
            });

        } catch (\Exception $e) {
            Log::error('[PublicFormSubmission] Error submitting form', [
                'product_uuid' => $productUuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat mensubmit form',
                'error' => 'INTERNAL_SERVER_ERROR'
            ], 500);
        }
    }

    /**
     * Build validation rules from form schema
     */
    private function buildValidationRules(array $formSchema): array
    {
        $rules = [];

        if (!isset($formSchema['fields']) || !is_array($formSchema['fields'])) {
            return $rules;
        }

        foreach ($formSchema['fields'] as $field) {
            $fieldName = $field['name'] ?? null;
            if (!$fieldName) {
                continue;
            }

            $fieldRules = [];

            if (isset($field['required']) && $field['required']) {
                $fieldRules[] = 'required';
            } else {
                $fieldRules[] = 'nullable';
            }

            $fieldType = $field['type'] ?? 'text';
            switch ($fieldType) {
                case 'email':
                    $fieldRules[] = 'email';
                    break;
                case 'number':
                    $fieldRules[] = 'numeric';
                    break;
                case 'url':
                    $fieldRules[] = 'url';
                    break;
                case 'date':
                    $fieldRules[] = 'date';
                    break;
                case 'file':
                    $fieldRules[] = 'file';
                    if (isset($field['validation']['maxSize'])) {
                        $fieldRules[] = 'max:' . ($field['validation']['maxSize'] / 1024);
                    }
                    break;
                case 'select':
                case 'radio':
                    if (isset($field['options']) && is_array($field['options'])) {
                        $allowedValues = array_column($field['options'], 'value');
                        if (!empty($allowedValues)) {
                            $fieldRules[] = 'in:' . implode(',', $allowedValues);
                        }
                    }
                    break;
                case 'multiselect':
                case 'checkbox':
                    $fieldRules[] = 'array';
                    break;
                default:
                    $fieldRules[] = 'string';
                    break;
            }

            if (isset($field['validation'])) {
                $validation = $field['validation'];

                if (isset($validation['minLength'])) {
                    $fieldRules[] = 'min:' . $validation['minLength'];
                }

                if (isset($validation['maxLength'])) {
                    $fieldRules[] = 'max:' . $validation['maxLength'];
                }

                if (isset($validation['pattern'])) {
                    $fieldRules[] = 'regex:' . $validation['pattern'];
                }
            }

            $rules[$fieldName] = implode('|', $fieldRules);
        }

        return $rules;
    }

    /**
     * Extract customer data from form submission
     */
    private function extractCustomerData(array $formData): array
    {
        $customerData = [];

        $fieldMapping = [
            'customer_name' => 'name',
            'name' => 'name',
            'email' => 'email',
            'phone' => 'phone',
            'telephone' => 'phone',
            'tel' => 'phone',
            'address' => 'address',
            'city' => 'city',
            'province' => 'province',
            'postal_code' => 'postal_code',
            'company' => 'company_name',
            'company_name' => 'company_name',
        ];

        foreach ($formData as $key => $value) {
            $normalizedKey = strtolower($key);
            if (isset($fieldMapping[$normalizedKey])) {
                $customerData[$fieldMapping[$normalizedKey]] = $value;
            }
        }

        return $customerData;
    }
}
