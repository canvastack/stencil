<?php

namespace App\Http\Requests\CustomerQuote;

use Illuminate\Foundation\Http\FormRequest;

class UpdateApprovalSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'auto_approval_enabled' => 'required|boolean',
            'auto_approval_threshold' => 'required|integer|min:0',
            'require_email_verification' => 'required|boolean',
            'min_successful_orders' => 'required|integer|min:0',
            'min_payment_success_rate' => 'required|numeric|min:0|max:100',
            'auto_approve_standard_products' => 'required|boolean',
            'require_approval_custom_products' => 'required|boolean',
            'max_negotiation_rounds' => 'required|integer|min:1|max:10',
            'allow_customer_counter_offer' => 'required|boolean',
            'notify_admin_on_auto_approve' => 'required|boolean',
            'notify_admin_on_pending_approval' => 'required|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'auto_approval_enabled.required' => 'Auto approval setting is required',
            'auto_approval_threshold.required' => 'Auto approval threshold is required',
            'auto_approval_threshold.min' => 'Auto approval threshold must be at least 0',
            'min_successful_orders.min' => 'Minimum successful orders must be at least 0',
            'min_payment_success_rate.min' => 'Minimum payment success rate must be at least 0%',
            'min_payment_success_rate.max' => 'Minimum payment success rate cannot exceed 100%',
            'max_negotiation_rounds.min' => 'Maximum negotiation rounds must be at least 1',
            'max_negotiation_rounds.max' => 'Maximum negotiation rounds cannot exceed 10',
        ];
    }

    public function attributes(): array
    {
        return [
            'auto_approval_enabled' => 'auto approval',
            'auto_approval_threshold' => 'auto approval threshold',
            'require_email_verification' => 'email verification requirement',
            'min_successful_orders' => 'minimum successful orders',
            'min_payment_success_rate' => 'minimum payment success rate',
            'auto_approve_standard_products' => 'auto approve standard products',
            'require_approval_custom_products' => 'require approval for custom products',
            'max_negotiation_rounds' => 'maximum negotiation rounds',
            'allow_customer_counter_offer' => 'allow customer counter offers',
            'notify_admin_on_auto_approve' => 'notify admin on auto approval',
            'notify_admin_on_pending_approval' => 'notify admin on pending approval',
        ];
    }
}
