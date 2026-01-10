<?php

namespace App\Infrastructure\Presentation\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $customerIdentifier = $this->route('customer');
        $tenant = $this->get('current_tenant') 
            ?? request()->attributes->get('tenant')
            ?? (app()->bound('current_tenant') ? app('current_tenant') : null);
        
        // Check if identifier is UUID or integer ID
        $isUuid = is_string($customerIdentifier) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $customerIdentifier);
        
        $emailRule = [
            'sometimes',
            'required',
            'email',
            'max:255',
        ];
        
        // Add unique rule with proper tenant scoping
        if ($tenant) {
            $emailRule[] = Rule::unique('customers', 'email')
                ->ignore($customerIdentifier, $isUuid ? 'uuid' : 'id')
                ->where('tenant_id', $tenant->id);
        } else {
            $emailRule[] = Rule::unique('customers', 'email')
                ->ignore($customerIdentifier, $isUuid ? 'uuid' : 'id');
        }
        
        return [
            'name' => 'sometimes|required|string|max:255',
            'email' => $emailRule,
            'phone' => 'sometimes|required|string|max:50',
            'company' => 'nullable|string|max:255',
            
            'customer_type' => ['nullable', Rule::in(['individual', 'business'])],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'blocked'])],
            
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'location' => 'nullable|array',
            
            'notes' => 'nullable|string',
            'tax_id' => 'nullable|string|max:100',
            'business_license' => 'nullable|string|max:100',
        ];
    }
}
