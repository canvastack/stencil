<?php

namespace App\Http\Requests\CustomerQuote;

use Illuminate\Foundation\Http\FormRequest;

class CreateCustomerQuoteRequest extends FormRequest
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
            'order_id' => 'required|integer|exists:orders,id',
            'vendor_quote_id' => 'required|integer|exists:vendor_quotes,id',
            'title' => 'required|string|max:255',
            'profit_percentage' => 'required|numeric|min:0|max:100',
            'handling_fee' => 'nullable|integer|min:0',
            'shipping_cost' => 'nullable|integer|min:0',
            'insurance' => 'nullable|integer|min:0',
            'other_costs' => 'nullable|integer|min:0',
            'other_costs_description' => 'nullable|string|max:500',
            'tax_rate' => 'required|numeric|min:0|max:100',
            'payment_terms' => 'required|string|max:500',
            'delivery_timeline' => 'nullable|string|max:255',
            'terms_conditions' => 'nullable|string',
            'valid_until' => 'required|date|after:now',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'order_id.required' => 'Order ID is required',
            'order_id.exists' => 'Selected order does not exist',
            'vendor_quote_id.required' => 'Vendor quote ID is required',
            'vendor_quote_id.exists' => 'Selected vendor quote does not exist',
            'title.required' => 'Quote title is required',
            'profit_percentage.required' => 'Profit percentage is required',
            'profit_percentage.min' => 'Profit percentage must be at least 0%',
            'profit_percentage.max' => 'Profit percentage cannot exceed 100%',
            'tax_rate.required' => 'Tax rate is required',
            'payment_terms.required' => 'Payment terms are required',
            'valid_until.required' => 'Valid until date is required',
            'valid_until.after' => 'Valid until date must be in the future',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'order_id' => 'order',
            'vendor_quote_id' => 'vendor quote',
            'profit_percentage' => 'profit percentage',
            'handling_fee' => 'handling fee',
            'shipping_cost' => 'shipping cost',
            'other_costs' => 'other costs',
            'other_costs_description' => 'other costs description',
            'tax_rate' => 'tax rate',
            'payment_terms' => 'payment terms',
            'delivery_timeline' => 'delivery timeline',
            'terms_conditions' => 'terms and conditions',
            'valid_until' => 'valid until date',
        ];
    }
}
