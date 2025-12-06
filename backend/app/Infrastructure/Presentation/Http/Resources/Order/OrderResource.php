<?php

namespace App\Infrastructure\Presentation\Http\Resources\Order;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'tenantId' => $this->tenant_id,
            
            // Flat structure for table compatibility
            'orderNumber' => $this->order_number,
            'orderCode' => $this->order_code,
            
            // Customer info (flattened)
            'customerId' => $this->customer_id,
            'customerName' => $this->customer->name ?? 'Unknown Customer',
            'customerEmail' => $this->customer->email ?? '',
            'customerPhone' => $this->customer->phone ?? '',
            
            // Vendor info (flattened)  
            'vendorId' => $this->vendor_id,
            'vendorName' => $this->vendor->name ?? null,
            'vendorCode' => $this->vendor->code ?? null,
            
            // Items (ensure it's always an array)
            'items' => is_array($this->items) ? $this->items : (is_string($this->items) ? json_decode($this->items, true) : []),
            
            // Financial info (flattened)
            'subtotal' => $this->subtotal ?? 0,
            'tax' => $this->tax ?? 0,
            'shippingCost' => $this->shipping_cost ?? 0,
            'discount' => $this->discount ?? 0,
            'totalAmount' => $this->total_amount ?? 0,
            'downPaymentAmount' => $this->down_payment_amount ?? 0,
            'paidAmount' => $this->total_paid_amount ?? 0,
            'remainingAmount' => max(0, ($this->total_amount ?? 0) - ($this->total_paid_amount ?? 0)),
            'disbursedAmount' => $this->total_disbursed_amount ?? 0,
            'currency' => $this->currency ?? 'IDR',
            
            // Status info (flattened)
            'status' => $this->status,
            'paymentStatus' => $this->payment_status,
            'paymentType' => $this->payment_type,
            
            // PT CEX Business Fields
            'vendorCost' => $this->vendor_cost ?? 0,
            'customerPrice' => $this->customer_price ?? 0,
            'markupAmount' => $this->markup_amount ?? 0,
            'markupPercentage' => $this->markup_percentage ?? 0,
            
            'production' => [
                'productionType' => $this->production_type,
                'paymentMethod' => $this->payment_method,
            ],
            
            'addresses' => [
                'shipping' => $this->shipping_address,
                'billing' => $this->billing_address,
            ],
            
            'notes' => [
                'customerNotes' => $this->customer_notes,
                'internalNotes' => $this->internal_notes,
            ],

            'negotiation' => data_get($this->metadata, 'negotiation'),
            
            // Timestamps (flattened) 
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'downPaymentDue' => $this->down_payment_due_at?->toIso8601String(),
            'downPaymentPaidAt' => $this->down_payment_paid_at?->toIso8601String(),
            'estimatedDelivery' => $this->estimated_delivery?->toIso8601String(),
            'actualDelivery' => $this->actual_delivery?->toIso8601String(),
            
            // Nested objects for detailed view
            'customer' => [
                'id' => $this->customer_id,
                'name' => $this->customer->name ?? 'Unknown Customer',
                'email' => $this->customer->email ?? '',
                'phone' => $this->customer->phone ?? '',
            ],
            
            'vendor' => $this->when($this->vendor_id, fn() => [
                'id' => $this->vendor_id,
                'name' => $this->vendor->name ?? null,
                'code' => $this->vendor->code ?? null,
            ]),
            
            'financial' => [
                'subtotal' => $this->subtotal ?? 0,
                'tax' => $this->tax ?? 0,
                'shippingCost' => $this->shipping_cost ?? 0,
                'discount' => $this->discount ?? 0,
                'totalAmount' => $this->total_amount ?? 0,
                'downPaymentAmount' => $this->down_payment_amount ?? 0,
                'paidAmount' => $this->total_paid_amount ?? 0,
                'remainingAmount' => max(0, ($this->total_amount ?? 0) - ($this->total_paid_amount ?? 0)),
                'currency' => $this->currency ?? 'IDR',
            ],
        ];
    }
}
