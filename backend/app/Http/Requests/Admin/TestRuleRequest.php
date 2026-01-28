<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class TestRuleRequest extends FormRequest
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
            'context' => ['sometimes', 'array'],
            'context.order_value' => ['sometimes', 'numeric', 'min:0'],
            'context.customer_id' => ['sometimes', 'string', 'max:255'],
            'context.vendor_id' => ['sometimes', 'string', 'max:255'],
            'context.payment_type' => ['sometimes', 'string', 'in:DP50,FULL,NET30,NET60'],
            'context.down_payment_amount' => ['sometimes', 'numeric', 'min:0'],
            'context.order_requirements' => ['sometimes', 'array'],
            'context.order_requirements.material' => ['sometimes', 'string', 'in:stainless_steel,aluminum,brass,glass,titanium,ceramic'],
            'context.order_requirements.timeline' => ['sometimes', 'date_format:Y-m-d'],
            'context.order_requirements.quantity' => ['sometimes', 'integer', 'min:1'],
            'context.order_requirements.quality_certifications' => ['sometimes', 'array'],
            'context.order_requirements.quality_certifications.*' => ['string', 'in:ISO9001,ISO14001,premium,standard,basic'],
            'context.order_requirements.quality_standards' => ['sometimes', 'array'],
            'context.order_requirements.quality_standards.*' => ['string', 'in:premium,standard,basic']
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'context.order_value.numeric' => 'Order value must be a valid number.',
            'context.order_value.min' => 'Order value must be greater than or equal to 0.',
            'context.payment_type.in' => 'Payment type must be one of: DP50, FULL, NET30, NET60.',
            'context.down_payment_amount.numeric' => 'Down payment amount must be a valid number.',
            'context.down_payment_amount.min' => 'Down payment amount must be greater than or equal to 0.',
            'context.order_requirements.material.in' => 'Material must be one of: stainless_steel, aluminum, brass, glass, titanium, ceramic.',
            'context.order_requirements.timeline.date_format' => 'Timeline must be in YYYY-MM-DD format.',
            'context.order_requirements.quantity.integer' => 'Quantity must be a valid integer.',
            'context.order_requirements.quantity.min' => 'Quantity must be at least 1.',
            'context.order_requirements.quality_certifications.*.in' => 'Quality certification must be one of: ISO9001, ISO14001, premium, standard, basic.',
            'context.order_requirements.quality_standards.*.in' => 'Quality standard must be one of: premium, standard, basic.'
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'context.order_value' => 'order value',
            'context.customer_id' => 'customer ID',
            'context.vendor_id' => 'vendor ID',
            'context.payment_type' => 'payment type',
            'context.down_payment_amount' => 'down payment amount',
            'context.order_requirements.material' => 'material',
            'context.order_requirements.timeline' => 'timeline',
            'context.order_requirements.quantity' => 'quantity',
            'context.order_requirements.quality_certifications' => 'quality certifications',
            'context.order_requirements.quality_standards' => 'quality standards'
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $context = $this->input('context', []);

            // Validate down payment amount against order value for DP50 payment type
            if (isset($context['payment_type']) && $context['payment_type'] === 'DP50') {
                $orderValue = $context['order_value'] ?? 0;
                $downPayment = $context['down_payment_amount'] ?? 0;

                if ($orderValue > 0 && $downPayment > $orderValue) {
                    $validator->errors()->add('context.down_payment_amount', 'Down payment amount cannot exceed order value.');
                }

                if ($orderValue > 0 && $downPayment < ($orderValue * 0.5)) {
                    $validator->errors()->add('context.down_payment_amount', 'Down payment amount must be at least 50% of order value for DP50 payment type.');
                }
            }

            // Validate timeline is not in the past
            if (isset($context['order_requirements']['timeline'])) {
                $timeline = $context['order_requirements']['timeline'];
                try {
                    $timelineDate = \Carbon\Carbon::createFromFormat('Y-m-d', $timeline);
                    if ($timelineDate->isPast()) {
                        $validator->errors()->add('context.order_requirements.timeline', 'Timeline cannot be in the past.');
                    }
                } catch (\Exception $e) {
                    // Date format validation will catch this
                }
            }
        });
    }
}