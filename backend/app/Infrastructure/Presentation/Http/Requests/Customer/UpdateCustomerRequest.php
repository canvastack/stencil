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
        $customerId = $this->route('customer');
        
        return [
            'name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('customers', 'email')->ignore($customerId),
            ],
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
