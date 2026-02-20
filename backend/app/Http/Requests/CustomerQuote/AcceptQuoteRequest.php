<?php

namespace App\Http\Requests\CustomerQuote;

use Illuminate\Foundation\Http\FormRequest;

class AcceptQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'terms_accepted' => 'required|boolean|accepted',
            'customer_id' => 'required|integer|exists:customers,id',
        ];
    }

    public function messages(): array
    {
        return [
            'terms_accepted.required' => 'You must accept the terms and conditions',
            'terms_accepted.accepted' => 'You must accept the terms and conditions to proceed',
            'customer_id.required' => 'Customer ID is required',
            'customer_id.exists' => 'Customer not found',
        ];
    }
}
