<?php

namespace App\Infrastructure\Presentation\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use App\Infrastructure\Persistence\Eloquent\Models\Product;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', $this->existsForTenant('customers')],
            'vendor_id' => ['nullable', 'integer', $this->existsForTenant('vendors')],
            
            'items' => 'required|array|min:1',
            'items.*.product_id' => ['required', 'integer', $this->existsForTenant('products')],
            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
                function ($attribute, $value, $fail) {
                    $index = explode('.', $attribute)[1];
                    $productId = $this->input("items.{$index}.product_id");
                    
                    if (!$productId) {
                        return;
                    }
                    
                    $product = Product::where('tenant_id', $this->resolveTenantId())
                        ->where('id', $productId)
                        ->first();
                    
                    if (!$product) {
                        return;
                    }
                    
                    if ($product->min_order_quantity && $value < $product->min_order_quantity) {
                        $fail("Minimal pesanan untuk {$product->name} adalah {$product->min_order_quantity} unit");
                    }
                    
                    if ($product->max_order_quantity && $value > $product->max_order_quantity) {
                        $fail("Maksimal pesanan untuk {$product->name} adalah {$product->max_order_quantity} unit");
                    }
                },
            ],
            'items.*.unit_price' => 'required|integer|min:0',
            'items.*.specifications' => 'nullable|array',
            'items.*.specifications.material' => [
                'nullable',
                'string',
                function ($attribute, $value, $fail) {
                    if (!$value) return;
                    
                    $index = explode('.', $attribute)[1];
                    $productId = $this->input("items.{$index}.product_id");
                    
                    if (!$productId) {
                        return;
                    }
                    
                    $product = Product::where('tenant_id', $this->resolveTenantId())
                        ->where('id', $productId)
                        ->first();
                    
                    if (!$product || !$product->available_materials) {
                        return;
                    }
                    
                    if (!in_array($value, $product->available_materials)) {
                        $fail("Material '{$value}' tidak tersedia untuk produk ini. Pilihan: " . implode(', ', $product->available_materials));
                    }
                },
            ],
            'items.*.specifications.quality' => [
                'nullable',
                'string',
                function ($attribute, $value, $fail) {
                    if (!$value) return;
                    
                    $index = explode('.', $attribute)[1];
                    $productId = $this->input("items.{$index}.product_id");
                    
                    if (!$productId) {
                        return;
                    }
                    
                    $product = Product::where('tenant_id', $this->resolveTenantId())
                        ->where('id', $productId)
                        ->first();
                    
                    if (!$product || !$product->quality_levels) {
                        return;
                    }
                    
                    if (!in_array($value, $product->quality_levels)) {
                        $fail("Tingkat kualitas '{$value}' tidak tersedia. Pilihan: " . implode(', ', $product->quality_levels));
                    }
                },
            ],
            'items.*.specifications.size' => 'nullable|string|max:100',
            'items.*.specifications.color' => 'nullable|string|max:100',
            'items.*.specifications.custom_text' => 'nullable|array',
            'items.*.custom_options' => 'nullable|array',
            'items.*.notes' => 'nullable|string',
            'items.*.design_file' => 'nullable|file|mimes:jpg,jpeg,png,pdf,ai,svg,eps|max:10240',
            
            'subtotal' => 'required|integer|min:0',
            'tax' => 'required|integer|min:0',
            'shipping_cost' => 'required|integer|min:0',
            'discount' => 'nullable|integer|min:0',
            'total_amount' => 'required|integer|min:0',
            
            'production_type' => ['nullable', Rule::in(['internal', 'vendor'])],
            'payment_method' => 'nullable|string|max:100',
            'down_payment_amount' => 'nullable|integer|min:0',
            'down_payment_due_at' => 'nullable|date',
            'payment_schedule' => 'nullable|array',
            
            'shipping_address' => 'required|string',
            'billing_address' => 'nullable|string',
            
            'customer_notes' => 'nullable|string',
            'internal_notes' => 'nullable|string',
            
            'estimated_delivery' => 'nullable|date',
        ];
    }

    protected function existsForTenant(string $table, string $column = 'id'): Exists
    {
        $tenantId = $this->resolveTenantId();
        $tenantId = $tenantId ? (int) $tenantId : 0;

        return Rule::exists($table, $column)->where(fn($query) => $query->where('tenant_id', $tenantId));
    }

    protected function resolveTenantId(): ?string
    {
        if (function_exists('tenant')) {
            $tenant = tenant();
            if ($tenant && isset($tenant->id)) {
                return $tenant->id;
            }
        }

        $requestTenant = $this->attributes->get('tenant')
            ?? $this->attributes->get('current_tenant')
            ?? $this->get('current_tenant');

        if (is_object($requestTenant) && isset($requestTenant->id)) {
            return $requestTenant->id;
        }

        if (app()->bound('tenant.current')) {
            $tenant = app('tenant.current');
            if ($tenant && isset($tenant->id)) {
                return $tenant->id;
            }
        }

        if (app()->bound('current_tenant')) {
            $tenant = app('current_tenant');
            if ($tenant && isset($tenant->id)) {
                return $tenant->id;
            }
        }

        $configTenant = config('multitenancy.current_tenant');
        if (is_object($configTenant) && isset($configTenant->id)) {
            return $configTenant->id;
        }

        return null;
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'Customer wajib dipilih',
            'customer_id.exists' => 'Customer tidak valid',
            'items.required' => 'Item pesanan wajib diisi',
            'items.min' => 'Minimal 1 item pesanan',
            'items.*.product_id.required' => 'Product wajib dipilih',
            'items.*.product_id.exists' => 'Product tidak valid',
            'items.*.quantity.required' => 'Jumlah wajib diisi',
            'items.*.quantity.min' => 'Jumlah minimal 1',
            'items.*.unit_price.required' => 'Harga satuan wajib diisi',
            'items.*.specifications.material.string' => 'Material harus berupa teks',
            'items.*.specifications.quality.string' => 'Tingkat kualitas harus berupa teks',
            'items.*.specifications.size.max' => 'Ukuran maksimal 100 karakter',
            'items.*.specifications.color.max' => 'Warna maksimal 100 karakter',
            'items.*.design_file.file' => 'Design harus berupa file',
            'items.*.design_file.mimes' => 'Format file design harus: jpg, jpeg, png, pdf, ai, svg, eps',
            'items.*.design_file.max' => 'Ukuran file design maksimal 10MB',
            'shipping_address.required' => 'Alamat pengiriman wajib diisi',
            'subtotal.required' => 'Subtotal wajib diisi',
            'tax.required' => 'Pajak wajib diisi',
            'shipping_cost.required' => 'Biaya pengiriman wajib diisi',
            'total_amount.required' => 'Total amount wajib diisi',
        ];
    }
}
