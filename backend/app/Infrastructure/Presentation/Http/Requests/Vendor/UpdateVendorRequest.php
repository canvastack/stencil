<?php

namespace App\Infrastructure\Presentation\Http\Requests\Vendor;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVendorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $vendorId = $this->route('vendor');
        
        return [
            'name' => 'sometimes|required|string|max:255',
            'code' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
                Rule::unique('vendors', 'code')->ignore($vendorId),
            ],
            'company' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:100',
            'company_size' => ['nullable', Rule::in(['small', 'medium', 'large'])],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('vendors', 'email')->ignore($vendorId),
            ],
            'phone' => 'sometimes|required|string|max:50',
            'contact_person' => 'sometimes|required|string|max:255',
            
            'category' => 'sometimes|required|string|max:100',
            'status' => ['nullable', Rule::in(['active', 'inactive', 'suspended'])],
            
            'location' => 'nullable|array',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            
            'payment_terms' => 'sometimes|required|string|max:100',
            'tax_id' => 'sometimes|required|string|max:100',
            'bank_account' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:100',
            
            'specializations' => 'nullable|array',
            'lead_time' => 'nullable|string|max:100',
            'minimum_order' => 'nullable|integer|min:1',
            
            'rating' => 'nullable|numeric|min:0|max:5',
            'total_orders' => 'nullable|integer|min:0',
            'total_value' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
        ];
    }
}
