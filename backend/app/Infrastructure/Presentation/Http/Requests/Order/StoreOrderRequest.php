<?php

namespace App\Infrastructure\Presentation\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

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
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|integer|min:0',
            'items.*.specifications' => 'nullable|array',
            'items.*.custom_options' => 'nullable|array',
            'items.*.notes' => 'nullable|string',
            
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
            'shipping_address.required' => 'Alamat pengiriman wajib diisi',
            'subtotal.required' => 'Subtotal wajib diisi',
            'tax.required' => 'Pajak wajib diisi',
            'shipping_cost.required' => 'Biaya pengiriman wajib diisi',
            'total_amount.required' => 'Total amount wajib diisi',
        ];
    }
}
