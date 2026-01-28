<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ValidateContextRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('manage-business-rules');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'context' => ['required', 'string', 'in:order_creation,order_validation,order_modification,vendor_selection,vendor_evaluation,payment_validation,payment_processing,quality_validation,credit_check,performance_review'],
            'data' => ['required', 'array'],
            'data.order_value' => ['sometimes', 'numeric', 'min:0'],
            'data.customer_id' => ['sometimes', 'string', 'max:255'],
            'data.vendor_id' => ['sometimes', 'string', 'max:255'],
            'data.payment_type' => ['sometimes', 'string', 'in:DP50,FULL,NET30,NET60'],
            'data.down_payment_amount' => ['sometimes', 'numeric', 'min:0'],
            'data.order_requirements' => ['sometimes', 'array'],
            'data.order_requirements.material' => ['sometimes', 'string', 'in:stainless_steel,aluminum,brass,glass,titanium,ceramic'],
            'data.order_requirements.timeline' => ['sometimes', 'date_format:Y-m-d'],
            'data.order_requirements.quantity' => ['sometimes', 'integer', 'min:1'],
            'data.order_requirements.quality_certifications' => ['sometimes', 'array'],
            'data.order_requirements.quality_certifications.*' => ['string', 'in:ISO9001,ISO14001,premium,standard,basic'],
            'data.order_requirements.quality_standards' => ['sometimes', 'array'],
            'data.order_requirements.quality_standards.*' => ['string', 'in:premium,standard,basic']
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'context.required' => 'Context is required for validation.',
            'context.in' => 'Context must be one of the supported validation contexts.',
            'data.required' => 'Data is required for context validation.',
            'data.array' => 'Data must be a valid object.',
            'data.order_value.numeric' => 'Order value must be a valid number.',
            'data.order_value.min' => 'Order value must be greater than or equal to 0.',
            'data.payment_type.in' => 'Payment type must be one of: DP50, FULL, NET30, NET60.',
            'data.down_payment_amount.numeric' => 'Down payment amount must be a valid number.',
            'data.down_payment_amount.min' => 'Down payment amount must be greater than or equal to 0.',
            'data.order_requirements.material.in' => 'Material must be one of: stainless_steel, aluminum, brass, glass, titanium, ceramic.',
            'data.order_requirements.timeline.date_format' => 'Timeline must be in YYYY-MM-DD format.',
            'data.order_requirements.quantity.integer' => 'Quantity must be a valid integer.',
            'data.order_requirements.quantity.min' => 'Quantity must be at least 1.',
            'data.order_requirements.quality_certifications.*.in' => 'Quality certification must be one of: ISO9001, ISO14001, premium, standard, basic.',
            'data.order_requirements.quality_standards.*.in' => 'Quality standard must be one of: premium, standard, basic.'
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'context' => 'validation context',
            'data' => 'validation data',
            'data.order_value' => 'order value',
            'data.customer_id' => 'customer ID',
            'data.vendor_id' => 'vendor ID',
            'data.payment_type' => 'payment type',
            'data.down_payment_amount' => 'down payment amount',
            'data.order_requirements.material' => 'material',
            'data.order_requirements.timeline' => 'timeline',
            'data.order_requirements.quantity' => 'quantity',
            'data.order_requirements.quality_certifications' => 'quality certifications',
            'data.order_requirements.quality_standards' => 'quality standards'
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $data = $this->input('data', []);
            $context = $this->input('context');

            // Context-specific validation
            switch ($context) {
                case 'order_creation':
                case 'order_validation':
                    if (!isset($data['order_value'])) {
                        $validator->errors()->add('data.order_value', 'Order value is required for order validation context.');
                    }
                    break;

                case 'vendor_selection':
                case 'vendor_evaluation':
                    if (!isset($data['vendor_id'])) {
                        $validator->errors()->add('data.vendor_id', 'Vendor ID is required for vendor validation context.');
                    }
                    break;

                case 'payment_validation':
                case 'payment_processing':
                    if (!isset($data['payment_type'])) {
                        $validator->errors()->add('data.payment_type', 'Payment type is required for payment validation context.');
                    }
                    if (!isset($data['order_value'])) {
                        $validator->errors()->add('data.order_value', 'Order value is required for payment validation context.');
                    }
                    break;

                case 'credit_check':
                    if (!isset($data['customer_id'])) {
                        $validator->errors()->add('data.customer_id', 'Customer ID is required for credit check context.');
                    }
                    if (!isset($data['order_value'])) {
                        $validator->errors()->add('data.order_value', 'Order value is required for credit check context.');
                    }
                    break;

                case 'quality_validation':
                    if (!isset($data['order_requirements'])) {
                        $validator->errors()->add('data.order_requirements', 'Order requirements are required for quality validation context.');
                    }
                    break;
            }

            // Validate down payment amount against order value for DP50 payment type
            if (isset($data['payment_type']) && $data['payment_type'] === 'DP50') {
                $orderValue = $data['order_value'] ?? 0;
                $downPayment = $data['down_payment_amount'] ?? 0;

                if ($orderValue > 0 && $downPayment > $orderValue) {
                    $validator->errors()->add('data.down_payment_amount', 'Down payment amount cannot exceed order value.');
                }

                if ($orderValue > 0 && $downPayment < ($orderValue * 0.5)) {
                    $validator->errors()->add('data.down_payment_amount', 'Down payment amount must be at least 50% of order value for DP50 payment type.');
                }
            }

            // Validate timeline is not in the past
            if (isset($data['order_requirements']['timeline'])) {
                $timeline = $data['order_requirements']['timeline'];
                try {
                    $timelineDate = \Carbon\Carbon::createFromFormat('Y-m-d', $timeline);
                    if ($timelineDate->isPast()) {
                        $validator->errors()->add('data.order_requirements.timeline', 'Timeline cannot be in the past.');
                    }
                } catch (\Exception $e) {
                    // Date format validation will catch this
                }
            }
        });
    }
}