<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RuleConfigurationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->getId()->getValue(),
            // ✅ SECURITY FIX: Don't expose internal tenant_id to public API
            // 'tenantId' => $this->getTenantId(), // REMOVED - internal ID should not be exposed
            'ruleCode' => $this->getRuleCode(),
            'enabled' => $this->isEnabled(),
            'priority' => $this->getPriority(),
            'parameters' => $this->getParameters(),
            'applicableContexts' => $this->getApplicableContexts(),
            'createdAt' => $this->getCreatedAt()->toISOString(),
            'updatedAt' => $this->getUpdatedAt()->toISOString(),
        ];
    }
}