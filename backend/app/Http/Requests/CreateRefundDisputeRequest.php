<?php

namespace App\Http\Requests;

use App\Infrastructure\Persistence\Eloquent\Models\RefundDispute;
use Illuminate\Foundation\Http\FormRequest;

class CreateRefundDisputeRequest extends FormRequest
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
            'refund_request_id' => 'required|string|exists:payment_refunds,id',
            'dispute_reason' => [
                'required',
                'string',
                'in:' . implode(',', RefundDispute::getDisputeReasons())
            ],
            'customer_claim' => 'required|string|min:10|max:2000',
            'evidence_customer' => 'sometimes|array',
            'evidence_customer.*.type' => 'required_with:evidence_customer|string|in:image,document,video,audio',
            'evidence_customer.*.file_path' => 'required_with:evidence_customer|string',
            'evidence_customer.*.description' => 'sometimes|string|max:500',
            'evidence_customer.*.uploaded_at' => 'sometimes|date',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'refund_request_id.required' => 'Refund request is required',
            'refund_request_id.exists' => 'Invalid refund request',
            'dispute_reason.required' => 'Dispute reason is required',
            'dispute_reason.in' => 'Invalid dispute reason',
            'customer_claim.required' => 'Customer claim is required',
            'customer_claim.min' => 'Customer claim must be at least 10 characters',
            'customer_claim.max' => 'Customer claim cannot exceed 2000 characters',
            'evidence_customer.*.type.required_with' => 'Evidence type is required',
            'evidence_customer.*.type.in' => 'Evidence type must be: image, document, video, or audio',
            'evidence_customer.*.file_path.required_with' => 'Evidence file path is required',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'refund_request_id' => 'refund request',
            'dispute_reason' => 'dispute reason',
            'customer_claim' => 'customer claim',
            'evidence_customer' => 'customer evidence',
        ];
    }
}