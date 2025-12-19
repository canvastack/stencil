<?php

namespace App\Infrastructure\Presentation\Http\Resources\Vendor;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'uuid' => $this->uuid,
            'tenant_id' => (string) $this->tenant_id,
            
            'name' => $this->name,
            'code' => $this->code,
            'company' => $this->company_name,
            'company_name' => $this->company_name,
            'industry' => $this->industry,
            'company_size' => $this->company_size,
            'email' => $this->email,
            'phone' => $this->phone,
            'contact_person' => $this->contact_person,
            
            'address' => $this->address,
            'location' => $this->location,
            
            'category' => $this->category,
            'status' => $this->status,
            
            'payment_terms' => $this->payment_terms,
            'tax_id' => $this->tax_id,
            'bank_account' => $this->bank_account,
            'bank_name' => $this->bank_name,
            
            'specializations' => $this->specializations ?? [],
            'lead_time' => $this->lead_time,
            'minimum_order' => $this->minimum_order,
            
            'rating' => (float) ($this->rating ?? 0),
            'total_orders' => (int) ($this->total_orders ?? 0),
            'total_value' => (int) ($this->total_value ?? 0),
            
            'notes' => $this->notes,
            
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
