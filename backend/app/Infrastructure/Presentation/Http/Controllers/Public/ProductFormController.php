<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\ProductFormConfiguration;
use App\Models\ProductFormSubmission;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Domain\Product\Services\ProductFormConfigurationService;
use App\Domain\Product\Services\FormDataValidationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ProductFormController extends Controller
{
    private ProductFormConfigurationService $formConfigService;
    private FormDataValidationService $validationService;

    public function __construct(
        ProductFormConfigurationService $formConfigService,
        FormDataValidationService $validationService
    ) {
        $this->formConfigService = $formConfigService;
        $this->validationService = $validationService;
    }
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

            $product = Product::where('uuid', $productUuid)
                ->where('status', 'published')
                ->first();

            if (!$product) {
                return response()->json([
                    'message' => 'Produk tidak ditemukan atau tidak tersedia',
                    'error' => 'PRODUCT_NOT_FOUND'
                ], 404);
            }

            // Use caching service for form configuration
            $configuration = $this->formConfigService->getActiveFormConfiguration($productUuid);

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
                ->with('tenant')
                ->first();

            if (!$product) {
                return response()->json([
                    'message' => 'Produk tidak ditemukan atau tidak tersedia',
                    'error' => 'PRODUCT_NOT_FOUND'
                ], 404);
            }

            // Use caching service for form configuration
            $configuration = $this->formConfigService->getActiveFormConfiguration($productUuid);

            if (!$configuration) {
                return response()->json([
                    'message' => 'Form configuration tidak tersedia',
                    'error' => 'FORM_CONFIG_NOT_FOUND'
                ], 404);
            }

            // Validate form data using schema-based validation service
            try {
                $formData = $request->except(['_form_started_at', '_token']);
                $validatedData = $this->validationService->validate($configuration, $formData);
            } catch (\Illuminate\Validation\ValidationException $e) {
                return response()->json([
                    'message' => 'Validasi form gagal',
                    'errors' => $e->errors()
                ], 422);
            }

            return DB::transaction(function () use ($request, $product, $configuration, $validatedData, $formData) {
                $startedAt = $request->input('_form_started_at');
                $completionTime = $startedAt ? now()->diffInSeconds($startedAt) : null;
                
                // Merge validated data with customer fields that may not be in form schema
                $customerFields = ['customer_name', 'name', 'email', 'phone', 'address', 'city', 'province', 'postal_code', 'company', 'company_name'];
                $mergedData = $validatedData;
                foreach ($customerFields as $field) {
                    if (isset($formData[$field])) {
                        $mergedData[$field] = $formData[$field];
                    }
                }
                
                $formData = $mergedData;

                Log::info('[PublicFormSubmission] Step 1: Extracting customer data', ['formData' => $formData]);
                $customerData = $this->extractCustomerData($formData);
                
                Log::info('[PublicFormSubmission] Step 2: Customer data extracted', ['customerData' => $customerData]);
                $customer = $this->findOrCreateCustomer($customerData, $product->tenant_id);

                if (!$customer) {
                    throw new \Exception('Failed to create or find customer record');
                }

                // Remove customer fields from form data before creating order
                $orderFormData = $formData;
                foreach ($customerFields as $field) {
                    unset($orderFormData[$field]);
                }

                Log::info('[PublicFormSubmission] Step 3: Customer found/created', ['customer_uuid' => $customer->uuid]);
                $order = $this->createOrder($product, $customer, $orderFormData);

                $submission = ProductFormSubmission::create([
                    'uuid' => Str::uuid()->toString(),
                    'tenant_id' => $product->tenant->uuid,
                    'product_id' => $product->id,
                    'product_uuid' => $product->uuid,
                    'form_configuration_id' => $configuration->id,
                    'form_configuration_uuid' => $configuration->uuid,
                    'order_id' => $order->id,
                    'order_uuid' => $order->uuid,
                    'customer_id' => $customer->id,
                    'customer_uuid' => $customer->uuid,
                    'submission_data' => $orderFormData,
                    'user_agent' => $request->header('User-Agent'),
                    'ip_address' => $request->ip(),
                    'referrer' => $request->header('Referer'),
                    'completion_time' => $completionTime,
                    'is_completed' => true,
                    'is_converted_to_order' => true,
                    'started_at' => $startedAt ? now()->parse($startedAt) : now(),
                    'submitted_at' => now(),
                ]);

                $configuration->increment('submission_count');
                
                if ($completionTime) {
                    $avgTime = ProductFormSubmission::where('form_configuration_id', $configuration->id)
                        ->whereNotNull('completion_time')
                        ->avg('completion_time');
                    
                    $configuration->update(['avg_completion_time' => (int) $avgTime]);
                }

                // Send email notification to customer
                try {
                    $customer->notify(new \App\Domain\Order\Notifications\OrderCreatedNotification($order));
                    
                    Log::info('[PublicFormSubmission] Email notification sent to customer', [
                        'customer_uuid' => $customer->uuid,
                        'customer_email' => $customer->email,
                        'order_uuid' => $order->uuid,
                    ]);
                } catch (\Exception $e) {
                    // Log error but don't fail the order creation
                    Log::error('[PublicFormSubmission] Failed to send email notification', [
                        'customer_uuid' => $customer->uuid,
                        'order_uuid' => $order->uuid,
                        'error' => $e->getMessage(),
                    ]);
                }

                Log::info('[PublicFormSubmission] Order created successfully', [
                    'order_uuid' => $order->uuid,
                    'order_number' => $order->order_number,
                    'customer_uuid' => $customer->uuid,
                    'product_uuid' => $product->uuid,
                ]);

                return response()->json([
                    'message' => 'Pesanan berhasil dibuat',
                    'data' => [
                        'order_uuid' => $order->uuid,
                        'order_number' => $order->order_number,
                        'submission_uuid' => $submission->uuid,
                        'customer_uuid' => $customer->uuid,
                        'submitted_at' => $submission->submitted_at->toIso8601String(),
                    ]
                ], 201);
            });

        } catch (\Exception $e) {
            Log::error('[PublicFormSubmission] Error submitting form', [
                'product_uuid' => $productUuid,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            $errorMessage = config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan saat mensubmit form';
            
            return response()->json([
                'message' => $errorMessage,
                'error' => 'INTERNAL_SERVER_ERROR',
                'debug' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'message' => $e->getMessage()
                ] : null
            ], 500);
        }
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
            'company' => 'company',
            'company_name' => 'company',
        ];

        foreach ($formData as $key => $value) {
            $normalizedKey = strtolower($key);
            if (isset($fieldMapping[$normalizedKey])) {
                $customerData[$fieldMapping[$normalizedKey]] = $value;
            }
        }

        return $customerData;
    }

    /**
     * Find or create customer from form data
     */
    private function findOrCreateCustomer(array $customerData, int $tenantId): Customer
    {
        $email = $this->sanitizeEmail($customerData['email'] ?? null);
        $phone = $this->sanitizePhone($customerData['phone'] ?? null);
        $name = trim($customerData['name'] ?? '');
        
        // If no name provided, generate a guest customer name
        if (empty($name)) {
            $name = 'Guest Customer ' . time();
        }

        // Validate email format
        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Invalid email format: ' . $email);
        }

        // Validate phone format (Indonesian phone numbers)
        if ($phone && !$this->isValidIndonesianPhone($phone)) {
            throw new \InvalidArgumentException('Invalid phone number format: ' . $phone);
        }

        // Note: We allow customers without email/phone as we generate dummy email if needed
        // This supports orders via form where contact info might be in notes/customization

        // Try to find existing customer (fuzzy match)
        $customer = null;
        if ($email || $phone) {
            $customer = Customer::where('tenant_id', $tenantId)
                ->where(function($q) use ($email, $phone) {
                    if ($email) $q->orWhere('email', $email);
                    if ($phone) $q->orWhere('phone', $phone);
                })
                ->first();
        }

        if ($customer) {
            // Update customer info if changed
            $customer->update([
                'name' => $name,
                'last_order_at' => now(),
            ]);

            Log::info('[PublicFormSubmission] Existing customer found and updated', [
                'customer_uuid' => $customer->uuid,
                'tenant_id' => $tenantId,
            ]);

            return $customer;
        }

        // Split name into first_name and last_name for backward compatibility
        $nameParts = explode(' ', $name, 2);
        $firstName = $nameParts[0] ?? 'Customer';
        $lastName = $nameParts[1] ?? '';

        // Create new customer
        $customer = Customer::create([
            'uuid' => Str::uuid()->toString(),
            'tenant_id' => $tenantId,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'name' => $name,
            'email' => $email ?: 'noemail_' . time() . '_' . rand(1000, 9999) . '@temporary.local',
            'phone' => $phone,
            'company' => trim($customerData['company'] ?? '') ?: null,
            'address' => trim($customerData['address'] ?? '') ?: null,
            'city' => trim($customerData['city'] ?? '') ?: null,
            'province' => trim($customerData['province'] ?? '') ?: null,
            'postal_code' => trim($customerData['postal_code'] ?? '') ?: null,
            'customer_type' => 'individual',
            'status' => 'active',
            'last_order_at' => now(),
            'metadata' => ['source' => 'website_form'],
        ]);

        Log::info('[PublicFormSubmission] New customer created', [
            'customer_uuid' => $customer->uuid,
            'tenant_id' => $tenantId,
        ]);

        return $customer;
    }

    /**
     * Sanitize email address
     */
    private function sanitizeEmail(?string $email): ?string
    {
        if (!$email) {
            return null;
        }

        return strtolower(trim($email));
    }

    /**
     * Sanitize phone number
     */
    private function sanitizePhone(?string $phone): ?string
    {
        if (!$phone) {
            return null;
        }

        // Remove spaces, dashes, parentheses
        $phone = preg_replace('/[^0-9+]/', '', $phone);

        // Normalize to +62 format for Indonesian numbers
        if (str_starts_with($phone, '0')) {
            $phone = '+62' . substr($phone, 1);
        } elseif (str_starts_with($phone, '62') && !str_starts_with($phone, '+')) {
            $phone = '+' . $phone;
        } elseif (!str_starts_with($phone, '+')) {
            // If no country code, assume Indonesian
            $phone = '+62' . $phone;
        }

        return $phone;
    }

    /**
     * Validate Indonesian phone number format
     */
    private function isValidIndonesianPhone(string $phone): bool
    {
        // Indonesian phone numbers should be +62 followed by 9-12 digits
        // Examples: +628123456789, +62811234567890
        return preg_match('/^\+62[0-9]{9,12}$/', $phone) === 1;
    }

    /**
     * Create order from product and form data
     */
    private function createOrder($product, Customer $customer, array $formData): Order
    {
        $quantity = (int) ($formData['quantity'] ?? $formData['jumlah'] ?? 1);
        $unitPrice = $product->price;
        $subtotal = $unitPrice * $quantity;

        $orderNumber = $this->generateOrderNumber();

        $order = Order::create([
            'uuid' => Str::uuid()->toString(),
            'tenant_id' => $product->tenant_id,
            'customer_id' => $customer->id,
            'order_number' => $orderNumber,
            'status' => 'new', // ✅ NEW status for customer orders from public form
            'payment_status' => 'unpaid',
            'production_type' => 'vendor',
            'items' => [[
                'product_id' => $product->id,
                'product_uuid' => $product->uuid,
                'product_name' => $product->name,
                'quantity' => $quantity,
                'price' => $unitPrice,
                'subtotal' => $subtotal,
                'customization' => $formData,
            ]],
            'subtotal' => $subtotal,
            'total_amount' => $subtotal,
            'currency' => $product->currency ?? 'IDR',
            'customer_notes' => $formData['notes'] ?? $formData['catatan'] ?? $formData['customer_notes'] ?? null,
        ]);

        return $order;
    }

    /**
     * Generate unique order number
     */
    private function generateOrderNumber(): string
    {
        $prefix = 'ORD';
        $date = now()->format('Ymd');
        $random = strtoupper(Str::random(6));
        return "{$prefix}-{$date}-{$random}";
    }
}
