<?php

namespace App\Infrastructure\Presentation\Http\Resources\Customer;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'tenantId' => $this->tenant_id,
            
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'company' => $this->company,
            
            'customerType' => $this->customer_type,
            'status' => $this->status,
            
            'address' => [
                'address' => $this->address,
                'city' => $this->city,
                'province' => $this->province,
                'postalCode' => $this->postal_code,
                'location' => $this->location,
            ],
            
            'business' => [
                'taxId' => $this->tax_id,
                'businessLicense' => $this->business_license,
            ],
            
            'stats' => [
                'totalOrders' => $this->total_orders ?? 0,
                'totalSpent' => $this->total_spent ?? 0,
                'lastOrderDate' => $this->last_order_date?->toIso8601String(),
            ],
            
            'notes' => $this->notes,
            
            'timestamps' => [
                'createdAt' => $this->created_at?->toIso8601String(),
                'updatedAt' => $this->updated_at?->toIso8601String(),
            ],
        ];
    }
}
