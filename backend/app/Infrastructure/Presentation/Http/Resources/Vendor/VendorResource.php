<?php

namespace App\Infrastructure\Presentation\Http\Resources\Vendor;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'tenantId' => $this->tenant_id,
            
            'name' => $this->name,
            'code' => $this->code,
            'email' => $this->email,
            'phone' => $this->phone,
            'contactPerson' => $this->contact_person,
            
            'category' => $this->category,
            'status' => $this->status,
            
            'location' => [
                'location' => $this->location,
                'address' => $this->address,
            ],
            
            'financial' => [
                'paymentTerms' => $this->payment_terms,
                'taxId' => $this->tax_id,
                'bankAccount' => $this->bank_account,
                'bankName' => $this->bank_name,
            ],
            
            'capabilities' => [
                'specializations' => $this->specializations ?? [],
                'leadTime' => $this->lead_time,
                'minimumOrder' => $this->minimum_order,
            ],
            
            'performance' => [
                'rating' => $this->rating,
                'totalOrders' => $this->total_orders ?? 0,
            ],
            
            'notes' => $this->notes,
            
            'timestamps' => [
                'createdAt' => $this->created_at?->toIso8601String(),
                'updatedAt' => $this->updated_at?->toIso8601String(),
            ],
        ];
    }
}
