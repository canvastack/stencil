<?php

namespace App\Http\Requests;

use App\Infrastructure\Persistence\Eloquent\Models\VendorLiability;
use Illuminate\Foundation\Http\FormRequest;

class CreateVendorLiabilityRequest extends FormRequest
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
        $rules = [
            'reason' => [
                'required',
                'string',
                'in:' . implode(',', VendorLiability::getLiabilityReasons())
            ],
            'liability_amount' => 'required|numeric|min:0|max:999999999.99',
        ];

        // Different validation for refund-based vs standalone
        if ($this->route()->getName() === 'vendor-liabilities.create-from-refund') {
            $rules['refund_request_id'] = 'required|string|exists:payment_refunds,id';
        } else {
            $rules['vendor_id'] = 'required|integer|exists:vendors,id';
            $rules['order_id'] = 'required|integer|exists:orders,id';
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'refund_request_id.required' => 'Refund request is required',
            'refund_request_id.exists' => 'Invalid refund request',
            'vendor_id.required' => 'Vendor is required',
            'vendor_id.exists' => 'Invalid vendor',
            'order_id.required' => 'Order is required',
            'order_id.exists' => 'Invalid order',
            'reason.required' => 'Liability reason is required',
            'reason.in' => 'Invalid liability reason',
            'liability_amount.required' => 'Liability amount is required',
            'liability_amount.numeric' => 'Liability amount must be a valid number',
            'liability_amount.min' => 'Liability amount cannot be negative',
            'liability_amount.max' => 'Liability amount is too large',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'refund_request_id' => 'refund request',
            'vendor_id' => 'vendor',
            'order_id' => 'order',
            'liability_amount' => 'liability amount',
        ];
    }
}