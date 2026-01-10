<?php

namespace App\Infrastructure\Presentation\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:customers,email',
            'phone' => 'required|string|max:50',
            'company' => 'nullable|string|max:255',
            
            'customer_type' => ['required', Rule::in(['individual', 'business'])],
            'type' => ['sometimes', Rule::in(['individual', 'business'])],
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
    
    protected function prepareForValidation()
    {
        // Map 'type' to 'customer_type' for backward compatibility
        if ($this->has('type') && !$this->has('customer_type')) {
            $this->merge([
                'customer_type' => $this->input('type')
            ]);
        }
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama customer wajib diisi',
            'email.required' => 'Email wajib diisi',
            'email.email' => 'Format email tidak valid',
            'email.unique' => 'Email sudah terdaftar',
            'phone.required' => 'Nomor telepon wajib diisi',
            'customer_type.required' => 'Tipe customer wajib dipilih',
        ];
    }
}
