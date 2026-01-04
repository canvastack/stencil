<?php

namespace App\Infrastructure\Presentation\Http\Resources\ProductForm;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FormTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'description' => $this->description,
            'category' => $this->category,
            
            'formSchema' => $this->when(
                $request->routeIs('*.show') || $request->has('include_schema'),
                $this->form_schema
            ),
            'validationRules' => $this->when(
                $request->routeIs('*.show') || $request->has('include_schema'),
                $this->validation_rules
            ),
            'conditionalLogic' => $this->when(
                $request->routeIs('*.show') || $request->has('include_schema'),
                $this->conditional_logic
            ),
            
            'fieldCount' => is_array($this->form_schema) && isset($this->form_schema['fields']) 
                ? count($this->form_schema['fields']) 
                : 0,
            
            'isPublic' => $this->is_public,
            'isSystem' => $this->is_system,
            
            'previewImageUrl' => $this->preview_image_url,
            'previewThumbnail' => $this->preview_image_url,
            'tags' => $this->tags ?? [],
            
            'usageCount' => $this->usage_count,
            
            'audit' => [
                'createdBy' => $this->createdBy?->name,
                'updatedBy' => $this->updatedBy?->name,
                'createdAt' => $this->created_at?->toIso8601String(),
                'updatedAt' => $this->updated_at?->toIso8601String(),
            ],
        ];
    }
}
