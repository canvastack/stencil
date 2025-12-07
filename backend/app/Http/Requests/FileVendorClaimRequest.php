<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FileVendorClaimRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled in controller
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'claim_notes' => 'required|string|min:10|max:2000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'claim_notes.required' => 'Claim notes are required',
            'claim_notes.min' => 'Claim notes must be at least 10 characters',
            'claim_notes.max' => 'Claim notes cannot exceed 2000 characters',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'claim_notes' => 'claim notes',
        ];
    }
}