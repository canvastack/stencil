<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Models\ProductFormConfiguration;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration converts hardcoded product fields to dynamic form configurations.
     * NO MOCK DATA - All form configurations are created from real product data in database.
     */
    public function up(): void
    {
        Log::info('[ProductFieldMigration] Starting migration of hardcoded fields to form configurations');
        
        // Get all products that have at least one hardcoded field
        $products = Product::where(function($query) {
            $query->whereNotNull('bahan')
                  ->orWhereNotNull('kualitas')
                  ->orWhereNotNull('ketebalan')
                  ->orWhereNotNull('ukuran')
                  ->orWhereNotNull('product_type');
        })->get();
        
        Log::info('[ProductFieldMigration] Found ' . $products->count() . ' products with hardcoded fields');
        
        $migratedCount = 0;
        $skippedCount = 0;
        
        foreach ($products as $product) {
            // Skip if product already has a form configuration
            $existingConfig = ProductFormConfiguration::where('product_id', $product->id)
                ->where('description', 'LIKE', '%Auto-migrated%')
                ->first();
            
            if ($existingConfig) {
                $skippedCount++;
                Log::info("[ProductFieldMigration] Product {$product->id} already has migrated config, skipping");
                continue;
            }
            
            try {
                DB::beginTransaction();
                
                $formSchema = $this->buildFormSchemaFromProduct($product);
                
                // Only create form config if we have fields to migrate
                if (!empty($formSchema['fields'])) {
                    $formConfig = ProductFormConfiguration::create([
                        'uuid' => Str::uuid()->toString(),
                        'tenant_id' => $product->tenant_id,
                        'product_id' => $product->id,
                        'product_uuid' => $product->uuid,
                        'name' => "{$product->name} - Order Form",
                        'description' => "Auto-migrated from hardcoded product fields on " . now()->toDateTimeString(),
                        'form_schema' => $formSchema,
                        'validation_rules' => $this->buildValidationRules($product),
                        'is_active' => true,
                        'is_default' => true, // Set as default form for this product
                        'is_template' => false,
                        'version' => 1,
                        'submission_count' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    
                    $migratedCount++;
                    
                    Log::info("[ProductFieldMigration] Successfully migrated product {$product->id} to form config {$formConfig->id}", [
                        'product_uuid' => $product->uuid,
                        'form_config_uuid' => $formConfig->uuid,
                        'fields_count' => count($formSchema['fields']),
                    ]);
                }
                
                DB::commit();
                
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error("[ProductFieldMigration] Failed to migrate product {$product->id}: " . $e->getMessage(), [
                    'product_uuid' => $product->uuid,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }
        
        Log::info('[ProductFieldMigration] Migration completed', [
            'total_products' => $products->count(),
            'migrated' => $migratedCount,
            'skipped' => $skippedCount,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Log::info('[ProductFieldMigration] Rolling back migration - removing auto-migrated form configurations');
        
        $deleted = ProductFormConfiguration::where('description', 'LIKE', '%Auto-migrated%')->delete();
        
        Log::info("[ProductFieldMigration] Rollback completed - deleted {$deleted} form configurations");
    }
    
    /**
     * Build form schema from product's hardcoded fields
     * NO MOCK DATA - All values come from real product data
     */
    private function buildFormSchemaFromProduct(Product $product): array
    {
        $fields = [];
        $order = 1;
        
        // Customer Information Section
        $fields[] = [
            'id' => 'field_customer_name_' . Str::random(8),
            'type' => 'text',
            'name' => 'customer_name',
            'label' => 'Nama Lengkap',
            'placeholder' => 'Masukkan nama lengkap Anda',
            'required' => true,
            'order' => $order++,
            'section' => 'customer_info',
        ];
        
        $fields[] = [
            'id' => 'field_customer_email_' . Str::random(8),
            'type' => 'email',
            'name' => 'customer_email',
            'label' => 'Email',
            'placeholder' => 'email@example.com',
            'required' => true,
            'order' => $order++,
            'section' => 'customer_info',
        ];
        
        $fields[] = [
            'id' => 'field_customer_phone_' . Str::random(8),
            'type' => 'tel',
            'name' => 'customer_phone',
            'label' => 'Nomor Telepon',
            'placeholder' => '08xxxxxxxxxx',
            'required' => true,
            'order' => $order++,
            'section' => 'customer_info',
        ];
        
        // Product Specification Section
        
        // Bahan (Material) - from real product data
        if ($product->bahan && $product->bahan_options) {
            $options = is_array($product->bahan_options) 
                ? $product->bahan_options 
                : json_decode($product->bahan_options, true);
                
            if (!empty($options)) {
                $fields[] = [
                    'id' => 'field_bahan_' . Str::random(8),
                    'type' => 'select',
                    'name' => 'bahan',
                    'label' => 'Material (Bahan)',
                    'placeholder' => 'Pilih material',
                    'required' => true,
                    'options' => array_map(function($option) {
                        return [
                            'value' => is_string($option) ? $option : $option['value'] ?? '',
                            'label' => is_string($option) ? $option : $option['label'] ?? ''
                        ];
                    }, $options),
                    'defaultValue' => $product->bahan,
                    'order' => $order++,
                    'section' => 'product_specification',
                ];
            }
        }
        
        // Kualitas (Quality) - from real product data
        if ($product->kualitas && $product->kualitas_options) {
            $options = is_array($product->kualitas_options) 
                ? $product->kualitas_options 
                : json_decode($product->kualitas_options, true);
                
            if (!empty($options)) {
                $fields[] = [
                    'id' => 'field_kualitas_' . Str::random(8),
                    'type' => 'select',
                    'name' => 'kualitas',
                    'label' => 'Kualitas',
                    'placeholder' => 'Pilih kualitas',
                    'required' => true,
                    'options' => array_map(function($option) {
                        return [
                            'value' => is_string($option) ? $option : $option['value'] ?? '',
                            'label' => is_string($option) ? $option : $option['label'] ?? ''
                        ];
                    }, $options),
                    'defaultValue' => $product->kualitas,
                    'order' => $order++,
                    'section' => 'product_specification',
                ];
            }
        }
        
        // Ketebalan (Thickness) - from real product data
        if ($product->ketebalan && $product->ketebalan_options) {
            $options = is_array($product->ketebalan_options) 
                ? $product->ketebalan_options 
                : json_decode($product->ketebalan_options, true);
                
            if (!empty($options)) {
                $fields[] = [
                    'id' => 'field_ketebalan_' . Str::random(8),
                    'type' => 'select',
                    'name' => 'ketebalan',
                    'label' => 'Ketebalan',
                    'placeholder' => 'Pilih ketebalan',
                    'required' => true,
                    'options' => array_map(function($option) {
                        return [
                            'value' => is_string($option) ? $option : $option['value'] ?? '',
                            'label' => is_string($option) ? $option : $option['label'] ?? ''
                        ];
                    }, $options),
                    'defaultValue' => $product->ketebalan,
                    'order' => $order++,
                    'section' => 'product_specification',
                ];
            }
        }
        
        // Ukuran (Size) - from real product data
        if ($product->ukuran && $product->ukuran_options) {
            $options = is_array($product->ukuran_options) 
                ? $product->ukuran_options 
                : json_decode($product->ukuran_options, true);
                
            if (!empty($options)) {
                $fields[] = [
                    'id' => 'field_ukuran_' . Str::random(8),
                    'type' => 'select',
                    'name' => 'ukuran',
                    'label' => 'Ukuran',
                    'placeholder' => 'Pilih ukuran',
                    'required' => true,
                    'options' => array_map(function($option) {
                        return [
                            'value' => is_string($option) ? $option : $option['value'] ?? '',
                            'label' => is_string($option) ? $option : $option['label'] ?? ''
                        ];
                    }, $options),
                    'defaultValue' => $product->ukuran,
                    'order' => $order++,
                    'section' => 'product_specification',
                ];
            }
        }
        
        // Warna Background - from real product data
        if ($product->warna_background) {
            $fields[] = [
                'id' => 'field_warna_' . Str::random(8),
                'type' => 'color',
                'name' => 'warna_background',
                'label' => 'Warna Background',
                'defaultValue' => $product->warna_background,
                'required' => false,
                'order' => $order++,
                'section' => 'customization',
            ];
        }
        
        // Quantity field
        $fields[] = [
            'id' => 'field_quantity_' . Str::random(8),
            'type' => 'number',
            'name' => 'quantity',
            'label' => 'Jumlah',
            'placeholder' => 'Masukkan jumlah',
            'required' => true,
            'min' => $product->min_order_quantity ?? 1,
            'max' => $product->max_order_quantity ?? 1000,
            'defaultValue' => $product->min_order_quantity ?? 1,
            'order' => $order++,
            'section' => 'order_details',
        ];
        
        // Design file upload
        $fields[] = [
            'id' => 'field_design_file_' . Str::random(8),
            'type' => 'file',
            'name' => 'design_file_url',
            'label' => 'Upload Design File',
            'accept' => '.pdf,.ai,.svg,.png,.jpg,.jpeg,.psd,.eps',
            'maxSize' => 10485760, // 10MB in bytes
            'required' => false,
            'helpText' => 'Format yang didukung: PDF, AI, SVG, PNG, JPG, PSD, EPS (Max 10MB)',
            'order' => $order++,
            'section' => 'customization',
        ];
        
        // Notes field
        $fields[] = [
            'id' => 'field_notes_' . Str::random(8),
            'type' => 'textarea',
            'name' => 'notes',
            'label' => 'Catatan Tambahan',
            'placeholder' => 'Masukkan catatan atau instruksi khusus untuk pesanan Anda...',
            'required' => false,
            'rows' => 5,
            'order' => $order++,
            'section' => 'order_details',
        ];
        
        return [
            'version' => '1.0',
            'title' => 'Formulir Pemesanan ' . $product->name,
            'description' => 'Isi formulir di bawah untuk memesan ' . $product->name,
            'sections' => [
                [
                    'id' => 'customer_info',
                    'title' => 'Informasi Pemesan',
                    'description' => 'Data kontak untuk konfirmasi pesanan',
                    'order' => 1,
                ],
                [
                    'id' => 'product_specification',
                    'title' => 'Spesifikasi Produk',
                    'description' => 'Pilih spesifikasi produk yang diinginkan',
                    'order' => 2,
                ],
                [
                    'id' => 'customization',
                    'title' => 'Kustomisasi',
                    'description' => 'Upload desain dan pilih warna',
                    'order' => 3,
                ],
                [
                    'id' => 'order_details',
                    'title' => 'Detail Pesanan',
                    'description' => 'Jumlah dan catatan tambahan',
                    'order' => 4,
                ],
            ],
            'fields' => $fields,
            'submitButton' => [
                'text' => 'Pesan Sekarang',
                'position' => 'center',
                'style' => 'primary',
                'loadingText' => 'Memproses pesanan...',
            ],
        ];
    }
    
    /**
     * Build validation rules from product data
     * NO MOCK DATA - Rules derived from real product constraints
     */
    private function buildValidationRules(Product $product): array
    {
        $rules = [
            'customer_name' => ['required', 'string', 'min:3', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'regex:/^[0-9]{10,15}$/'],
            'quantity' => [
                'required', 
                'integer', 
                'min:' . ($product->min_order_quantity ?? 1),
                'max:' . ($product->max_order_quantity ?? 1000),
            ],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
        
        if ($product->bahan && $product->bahan_options) {
            $rules['bahan'] = ['required', 'string'];
        }
        
        if ($product->kualitas && $product->kualitas_options) {
            $rules['kualitas'] = ['required', 'string'];
        }
        
        if ($product->ketebalan && $product->ketebalan_options) {
            $rules['ketebalan'] = ['required', 'string'];
        }
        
        if ($product->ukuran && $product->ukuran_options) {
            $rules['ukuran'] = ['required', 'string'];
        }
        
        if ($product->warna_background) {
            $rules['warna_background'] = ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'];
        }
        
        $rules['design_file_url'] = ['nullable', 'url'];
        
        return $rules;
    }
};
