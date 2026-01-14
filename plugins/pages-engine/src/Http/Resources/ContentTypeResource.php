<?php

namespace Plugins\PagesEngine\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'tenant_id' => $this->tenantId,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'default_url_pattern' => $this->defaultUrlPattern,
            'scope' => $this->scope,
            'is_active' => $this->isActive,
            'is_commentable' => $this->isCommentable,
            'is_categorizable' => $this->isCategorizable,
            'is_taggable' => $this->isTaggable,
            'is_revisioned' => $this->isRevisioned,
            'metadata' => $this->metadata,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
