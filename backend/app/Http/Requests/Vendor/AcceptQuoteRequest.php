<?php

namespace App\Http\Requests\Vendor;

use Illuminate\Foundation\Http\FormRequest;

/**
 * AcceptQuoteRequest
 * 
 * Validates vendor quote acceptance request.
 * 
 * Requirements: 6.3
 */
class AcceptQuoteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'estimated_delivery_days' => ['required', 'integer', 'min:1', 'max:365'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'estimated_delivery_days.required' => 'Estimated delivery days is required',
            'estimated_delivery_days.integer' => 'Estimated delivery days must be a number',
            'estimated_delivery_days.min' => 'Estimated delivery days must be at least 1 day',
            'estimated_delivery_days.max' => 'Estimated delivery days cannot exceed 365 days',
            'notes.max' => 'Notes cannot exceed 1000 characters',
        ];
    }
}
