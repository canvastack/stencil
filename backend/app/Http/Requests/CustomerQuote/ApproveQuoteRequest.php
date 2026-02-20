<?php

namespace App\Http\Requests\CustomerQuote;

use Illuminate\Foundation\Http\FormRequest;

class ApproveQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'notes.max' => 'Approval notes cannot exceed 1000 characters',
        ];
    }
}
