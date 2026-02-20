<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerQuoteResource extends JsonResource
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
            'uuid' => $this->uuid,
            'quote_number' => $this->quote_number,
            'title' => $this->title,
            'description' => $this->description,
            
            // Pricing information (converted from cents to currency)
            'pricing' => [
                'vendor_total_cost' => $this->vendor_total_cost,
                'base_profit_amount' => $this->base_profit_amount,
                'base_profit_percentage' => $this->base_profit_percentage,
                'handling_fee' => $this->handling_fee,
                'shipping_cost' => $this->shipping_cost,
                'insurance' => $this->insurance,
                'other_costs' => $this->other_costs,
                'other_costs_description' => $this->other_costs_description,
                'subtotal' => $this->subtotal,
                'tax_rate' => $this->tax_rate,
                'tax_amount' => $this->tax_amount,
                'grand_total' => $this->grand_total,
                'total_profit_amount' => $this->total_profit_amount,
                'total_profit_percentage' => $this->total_profit_percentage,
                'currency' => $this->currency,
            ],
            
            // Terms
            'terms' => [
                'valid_until' => $this->valid_until?->toIso8601String(),
                'payment_terms' => $this->payment_terms,
                'delivery_timeline' => $this->delivery_timeline,
                'terms_and_conditions' => $this->terms_and_conditions,
            ],
            
            // Status and workflow
            'status' => $this->status,
            'is_expired' => $this->isExpired(),
            'can_be_accepted' => $this->canBeAccepted(),
            'can_be_countered' => $this->canBeCountered(),
            
            // Timestamps
            'sent_at' => $this->sent_at?->toIso8601String(),
            'viewed_at' => $this->viewed_at?->toIso8601String(),
            'responded_at' => $this->responded_at?->toIso8601String(),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'rejected_at' => $this->rejected_at?->toIso8601String(),
            'expired_at' => $this->expired_at?->toIso8601String(),
            
            // Negotiation
            'negotiation' => [
                'counter_offer_amount' => $this->counter_offer_amount,
                'counter_offer_notes' => $this->counter_offer_notes,
                'counter_offer_round' => $this->counter_offer_round,
                'max_negotiation_rounds' => $this->max_negotiation_rounds,
            ],
            
            // Approval
            'approval' => [
                'method' => $this->approval_method,
                'reason' => $this->approval_reason,
                'notes' => $this->approval_notes,
            ],
            
            // Rejection
            'rejection_reason' => $this->rejection_reason,
            
            // Payment status (only for accepted quotes)
            'payment' => $this->when($this->status === 'accepted', function () use ($request) {
                return [
                    'status' => $this->getPaymentStatus(),
                    'total_paid' => $this->getTotalPaidAmount(),
                    'remaining' => $this->getRemainingPaymentAmount(),
                    'is_down_payment_paid' => $this->isDownPaymentPaid(),
                    'is_fully_paid' => $this->isFullyPaid(),
                    // Include detailed payment summary for admin users
                    'summary' => $this->when($request->user(), function () {
                        $paymentService = app(\App\Application\CustomerQuote\Services\PaymentTrackingService::class);
                        return $paymentService->getPaymentSummary($this->resource);
                    }),
                ];
            }),
            
            // Response token (only for admin, hidden from customer)
            'response_token' => $this->when($request->user(), $this->response_token),
            
            // Relationships
            'order' => $this->whenLoaded('order'),
            'vendor_quote' => $this->whenLoaded('vendorQuote'),
            'created_by' => $this->whenLoaded('createdBy', function () {
                return [
                    'id' => $this->createdBy->id,
                    'name' => $this->createdBy->name,
                    'email' => $this->createdBy->email,
                ];
            }),
            'approved_by' => $this->whenLoaded('approvedBy', function () {
                return [
                    'id' => $this->approvedBy->id,
                    'name' => $this->approvedBy->name,
                    'email' => $this->approvedBy->email,
                ];
            }),
            'documents' => OrderDocumentResource::collection($this->whenLoaded('documents')),
            
            // Document count (without loading all documents)
            'documents_count' => $this->when(
                !$this->relationLoaded('documents'),
                function () {
                    return $this->documents()->count();
                }
            ),
            
            // History (only for admin)
            'history' => $this->when($request->user(), $this->history),
            
            // Metadata
            'metadata' => $this->metadata,
            
            // Timestamps
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
