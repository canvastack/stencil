<?php

namespace Plugins\PagesEngine\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'content_type_id' => $this->contentTypeId,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'featured_image_id' => $this->featuredImageId,
            'status' => $this->status,
            'author_id' => $this->authorId,
            'view_count' => $this->viewCount,
            'comment_count' => $this->commentCount,
            'published_at' => $this->publishedAt,
            'created_at' => $this->createdAt,
        ];
    }
}
