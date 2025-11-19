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
            
            'orderNumber' => $this->order_number,
            'orderCode' => $this->order_code,
            
            'customer' => [
                'id' => $this->customer_id,
                'name' => $this->customer->name ?? null,
                'email' => $this->customer->email ?? null,
                'phone' => $this->customer->phone ?? null,
            ],
            
            'vendor' => $this->when($this->vendor_id, fn() => [
                'id' => $this->vendor_id,
                'name' => $this->vendor->name ?? null,
                'code' => $this->vendor->code ?? null,
            ]),
            
            'items' => $this->items ?? [],
            
            'financial' => [
                'subtotal' => $this->subtotal,
                'tax' => $this->tax,
                'shippingCost' => $this->shipping_cost,
                'discount' => $this->discount,
                'totalAmount' => $this->total_amount,
                'downPaymentAmount' => $this->down_payment_amount,
                'paidAmount' => $this->total_paid_amount,
                'disbursedAmount' => $this->total_disbursed_amount,
                'balanceDue' => max(0, ($this->total_amount ?? 0) - ($this->total_paid_amount ?? 0)),
                'currency' => $this->currency ?? 'IDR',
            ],
            
            'status' => [
                'orderStatus' => $this->status,
                'paymentStatus' => $this->payment_status,
            ],
            
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
            
            'timeline' => [
                'orderDate' => $this->order_date?->toIso8601String(),
                'downPaymentDue' => $this->down_payment_due_at?->toIso8601String(),
                'downPaymentPaidAt' => $this->down_payment_paid_at?->toIso8601String(),
                'estimatedDelivery' => $this->estimated_delivery?->toIso8601String(),
                'actualDelivery' => $this->actual_delivery?->toIso8601String(),
            ],
            
            'timestamps' => [
                'createdAt' => $this->created_at?->toIso8601String(),
                'updatedAt' => $this->updated_at?->toIso8601String(),
            ],
        ];
    }
}
