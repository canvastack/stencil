<?php

namespace App\Infrastructure\Presentation\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    'new',
                    'sourcing_vendor',
                    'vendor_negotiation',
                    'customer_quotation',
                    'waiting_payment',
                    'payment_received',
                    'in_production',
                    'quality_check',
                    'ready_to_ship',
                    'shipped',
                    'delivered',
                    'completed',
                    'cancelled',
                    'refunded',
                ]),
            ],
            'notes' => 'nullable|string',
            'tracking_number' => 'nullable|string|max:100',
            'estimated_delivery' => 'nullable|date',
            'metadata' => 'nullable|array',
            'metadata.payment' => 'nullable|array',
            'metadata.payment.amount' => 'nullable|integer|min:1',
            'metadata.payment.method' => 'nullable|string|max:100',
            'metadata.payment.currency' => 'nullable|string|size:3',
            'metadata.payment.reference' => 'nullable|string|max:191',
            'metadata.payment.paid_at' => 'nullable|date',
            'metadata.payment.due_at' => 'nullable|date',
            'metadata.down_payment_amount' => 'nullable|integer|min:0',
            'metadata.disbursement' => 'nullable|array',
            'metadata.disbursement.amount' => 'nullable|integer|min:1',
            'metadata.disbursement.vendor_id' => 'nullable|integer',
            'metadata.disbursement.method' => 'nullable|string|max:100',
            'metadata.disbursement.reference' => 'nullable|string|max:191',
            'metadata.disbursement.paid_at' => 'nullable|date',
            'metadata.disbursement.due_at' => 'nullable|date',
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status wajib dipilih',
            'status.in' => 'Status tidak valid',
        ];
    }
}
