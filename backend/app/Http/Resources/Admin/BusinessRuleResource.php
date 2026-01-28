<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessRuleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'code' => $this->getRuleCode(),
            'name' => $this->getName(),
            'description' => $this->getDescription(),
            'category' => $this->getCategory(),
            'priority' => $this->getPriority(),
            'severity' => $this->getSeverity(),
            'enabled' => $this->isEnabled(),
            'parameters' => $this->getParameters(),
            'defaultParameters' => $this->getDefaultParameters(),
            'defaultPriority' => $this->getDefaultPriority(),
            'applicableContexts' => $this->getApplicableContexts(),
            'metadata' => $this->getMetadata()
        ];
    }
}