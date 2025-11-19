<?php

namespace App\Infrastructure\Presentation\Http\Requests\Vendor;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVendorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:vendors,code',
            'email' => 'required|email|max:255|unique:vendors,email',
            'phone' => 'required|string|max:50',
            'contact_person' => 'required|string|max:255',
            
            'category' => 'required|string|max:100',
            'status' => ['nullable', Rule::in(['active', 'inactive', 'suspended'])],
            
            'location' => 'required|array',
            'address' => 'nullable|string',
            
            'payment_terms' => 'required|string|max:100',
            'tax_id' => 'required|string|max:100',
            'bank_account' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:100',
            
            'specializations' => 'nullable|array',
            'lead_time' => 'nullable|string|max:100',
            'minimum_order' => 'nullable|integer|min:1',
            
            'rating' => 'nullable|numeric|min:0|max:5',
            'notes' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama vendor wajib diisi',
            'code.required' => 'Kode vendor wajib diisi',
            'code.unique' => 'Kode vendor sudah digunakan',
            'email.required' => 'Email wajib diisi',
            'email.unique' => 'Email sudah terdaftar',
            'phone.required' => 'Nomor telepon wajib diisi',
            'contact_person.required' => 'Nama kontak person wajib diisi',
            'category.required' => 'Kategori vendor wajib dipilih',
            'location.required' => 'Lokasi vendor wajib diisi',
            'payment_terms.required' => 'Term pembayaran wajib diisi',
            'tax_id.required' => 'NPWP wajib diisi',
        ];
    }
}
