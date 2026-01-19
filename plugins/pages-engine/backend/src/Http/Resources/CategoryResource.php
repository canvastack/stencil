<?php

namespace Plugins\PagesEngine\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'tenant_id' => $this->tenantId,
            'content_type_id' => $this->contentTypeId,
            'name' => $this->name,
            'slug' => $this->slug,
            'parent_id' => $this->parentId,
            'level' => $this->level,
            'path' => $this->path,
            'description' => $this->description,
            'sort_order' => $this->sortOrder,
            'seo_title' => $this->seoTitle,
            'seo_description' => $this->seoDescription,
            'content_count' => $this->contentCount,
            'metadata' => $this->metadata,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
