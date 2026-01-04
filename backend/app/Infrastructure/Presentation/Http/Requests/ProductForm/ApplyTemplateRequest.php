<?php

namespace App\Infrastructure\Presentation\Http\Requests\ProductForm;

use Illuminate\Foundation\Http\FormRequest;

class ApplyTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function stopOnFirstFailure(): bool
    {
        return false;
    }

    public function rules(): array
    {
        return [
            'product_uuids' => 'required|array|min:1|max:50',
            'product_uuids.*' => 'required|uuid',
            'overwrite_existing' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'product_uuids.required' => 'Minimal 1 produk harus dipilih',
            'product_uuids.min' => 'Minimal 1 produk harus dipilih',
            'product_uuids.max' => 'Maksimal 50 produk dapat diproses sekaligus',
            'product_uuids.*.uuid' => 'Format UUID produk tidak valid',
        ];
    }
}
