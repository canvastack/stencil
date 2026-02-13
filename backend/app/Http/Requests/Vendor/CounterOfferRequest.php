<?php

namespace App\Http\Requests\Vendor;

use Illuminate\Foundation\Http\FormRequest;

/**
 * CounterOfferRequest
 * 
 * Validates vendor quote counter offer request.
 * 
 * Requirements: 6.9
 */
class CounterOfferRequest extends FormRequest
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
            // New format: item-by-item pricing
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'string'],
            'items.*.counter_unit_price' => ['required', 'numeric', 'min:0.01'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
            
            // Optional fields
            'notes' => ['nullable', 'string', 'max:1000'],
            'estimated_delivery_days' => ['nullable', 'integer', 'min:1'],
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
            'items.required' => 'At least one item is required',
            'items.array' => 'Items must be an array',
            'items.min' => 'At least one item is required',
            'items.*.product_id.required' => 'Product ID is required for each item',
            'items.*.counter_unit_price.required' => 'Counter price is required for each item',
            'items.*.counter_unit_price.numeric' => 'Counter price must be a number',
            'items.*.counter_unit_price.min' => 'Counter price must be greater than 0',
            'items.*.notes.max' => 'Item notes cannot exceed 500 characters',
            'notes.max' => 'Notes cannot exceed 1000 characters',
            'estimated_delivery_days.integer' => 'Estimated delivery days must be a number',
            'estimated_delivery_days.min' => 'Estimated delivery days must be at least 1',
        ];
    }
}
