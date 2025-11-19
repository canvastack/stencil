<?php

namespace App\Infrastructure\Presentation\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class UpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['sometimes', 'required', 'integer', $this->existsForTenant('customers')],
            'vendor_id' => ['nullable', 'integer', $this->existsForTenant('vendors')],
            
            'items' => 'sometimes|required|array|min:1',
            'items.*.product_id' => ['required', 'integer', $this->existsForTenant('products')],
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|integer|min:0',
            'items.*.specifications' => 'nullable|array',
            'items.*.custom_options' => 'nullable|array',
            'items.*.notes' => 'nullable|string',
            
            'subtotal' => 'sometimes|required|integer|min:0',
            'tax' => 'sometimes|required|integer|min:0',
            'shipping_cost' => 'sometimes|required|integer|min:0',
            'discount' => 'nullable|integer|min:0',
            'total_amount' => 'sometimes|required|integer|min:0',
            
            'production_type' => ['nullable', Rule::in(['internal', 'vendor'])],
            'payment_method' => 'nullable|string|max:100',
            
            'shipping_address' => 'sometimes|required|string',
            'billing_address' => 'nullable|string',
            
            'customer_notes' => 'nullable|string',
            'internal_notes' => 'nullable|string',
            
            'estimated_delivery' => 'nullable|date',
            'actual_delivery' => 'nullable|date',
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
}
