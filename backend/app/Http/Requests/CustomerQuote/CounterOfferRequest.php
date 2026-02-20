<?php

namespace App\Http\Requests\CustomerQuote;

use Illuminate\Foundation\Http\FormRequest;

class CounterOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'counter_amount' => 'required|integer|min:0',
            'reason' => 'required|string|min:20|max:1000',
            'customer_id' => 'required|integer|exists:customers,id',
        ];
    }

    public function messages(): array
    {
        return [
            'counter_amount.required' => 'Counter offer amount is required',
            'counter_amount.min' => 'Counter offer amount must be at least 0',
            'reason.required' => 'Please provide a reason for your counter offer',
            'reason.min' => 'Reason must be at least 20 characters',
            'reason.max' => 'Reason cannot exceed 1000 characters',
            'customer_id.required' => 'Customer ID is required',
            'customer_id.exists' => 'Customer not found',
        ];
    }
}
