<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

/**
 * AdminCounterOfferRequest
 * 
 * Validates admin counter offer submission.
 */
class AdminCounterOfferRequest extends FormRequest
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
     */
    public function rules(): array
    {
        return [
            'counter_offer_amount' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|string',
            'items.*.admin_counter_unit_price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'counter_offer_amount.required' => 'Counter offer amount is required',
            'counter_offer_amount.numeric' => 'Counter offer amount must be a number',
            'counter_offer_amount.min' => 'Counter offer amount must be at least 0',
            'items.required' => 'At least one item is required',
            'items.array' => 'Items must be an array',
            'items.min' => 'At least one item is required',
            'items.*.product_id.required' => 'Product ID is required for each item',
            'items.*.admin_counter_unit_price.required' => 'Counter price is required for each item',
            'items.*.admin_counter_unit_price.numeric' => 'Counter price must be a number',
            'items.*.admin_counter_unit_price.min' => 'Counter price must be at least 0',
            'items.*.notes.max' => 'Item notes cannot exceed 500 characters',
            'notes.max' => 'Notes cannot exceed 1000 characters',
        ];
    }
}
