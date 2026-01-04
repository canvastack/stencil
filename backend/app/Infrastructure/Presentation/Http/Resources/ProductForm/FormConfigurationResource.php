<?php

namespace App\Infrastructure\Presentation\Http\Resources\ProductForm;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FormConfigurationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'productUuid' => $this->product_uuid,
            'productName' => $this->product?->name,
            
            'name' => $this->name,
            'description' => $this->description,
            
            'formSchema' => $this->form_schema,
            'validationRules' => $this->validation_rules,
            'conditionalLogic' => $this->conditional_logic,
            
            'isActive' => $this->is_active,
            'isDefault' => $this->is_default,
            'isTemplate' => $this->is_template,
            'version' => $this->version,
            
            'template' => $this->when($this->template, function () {
                return [
                    'uuid' => $this->template->uuid,
                    'name' => $this->template->name,
                    'category' => $this->template->category,
                ];
            }),
            
            'analytics' => [
                'submissionCount' => $this->submission_count,
                'avgCompletionTime' => $this->avg_completion_time,
            ],
            
            'audit' => [
                'createdBy' => $this->createdBy?->name,
                'updatedBy' => $this->updatedBy?->name,
                'createdAt' => $this->created_at?->toIso8601String(),
                'updatedAt' => $this->updated_at?->toIso8601String(),
            ],
        ];
    }
}
