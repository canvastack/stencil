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
                'required',
                'string',
                'max:50',
                Rule::unique('vendors', 'code')->ignore($vendorId),
            ],
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
            
            'location' => 'sometimes|required|array',
            'address' => 'nullable|string',
            
            'payment_terms' => 'sometimes|required|string|max:100',
            'tax_id' => 'sometimes|required|string|max:100',
            'bank_account' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:100',
            
            'specializations' => 'nullable|array',
            'lead_time' => 'nullable|string|max:100',
            'minimum_order' => 'nullable|integer|min:1',
            
            'rating' => 'nullable|numeric|min:0|max:5',
            'notes' => 'nullable|string',
        ];
    }
}
