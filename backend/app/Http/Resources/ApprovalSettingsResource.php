<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApprovalSettingsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            
            // Auto-approval rules
            'auto_approval' => [
                'enabled' => $this->auto_approval_enabled,
                'threshold' => $this->auto_approval_threshold,
                'threshold_formatted' => $this->formatCurrency($this->auto_approval_threshold),
            ],
            
            // Customer trust requirements
            'trust_requirements' => [
                'require_email_verification' => $this->require_email_verification,
                'min_successful_orders' => $this->min_successful_orders,
                'min_payment_success_rate' => $this->min_payment_success_rate,
            ],
            
            // Product type rules
            'product_rules' => [
                'auto_approve_standard_products' => $this->auto_approve_standard_products,
                'require_approval_custom_products' => $this->require_approval_custom_products,
            ],
            
            // Negotiation settings
            'negotiation' => [
                'max_rounds' => $this->max_negotiation_rounds,
                'allow_customer_counter_offer' => $this->allow_customer_counter_offer,
            ],
            
            // Notification settings
            'notifications' => [
                'notify_admin_on_auto_approve' => $this->notify_admin_on_auto_approve,
                'notify_admin_on_pending_approval' => $this->notify_admin_on_pending_approval,
            ],
            
            // Timestamps
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Format currency amount (cents to IDR)
     */
    private function formatCurrency(int $cents): string
    {
        $amount = $cents / 100;
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }
}
