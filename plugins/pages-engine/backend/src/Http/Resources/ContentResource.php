<?php

namespace Plugins\PagesEngine\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'content_type' => [
                'uuid' => $this->contentType->uuid ?? null,
                'name' => $this->contentType->name ?? null,
                'slug' => $this->contentType->slug ?? null,
            ],
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'content_format' => $this->content_format,
            'featured_image_id' => $this->featured_image_id,
            'status' => $this->status,
            'author' => [
                'uuid' => $this->author->uuid ?? null,
                'name' => $this->author->name ?? null,
                'email' => $this->author->email ?? null,
            ],
            'categories' => $this->when(
                $this->relationLoaded('categories'),
                fn() => $this->categories->map(fn($cat) => [
                    'uuid' => $cat->uuid,
                    'name' => $cat->name,
                    'slug' => $cat->slug,
                ])
            ),
            'tags' => $this->when(
                $this->relationLoaded('tags'),
                fn() => $this->tags->map(fn($tag) => [
                    'uuid' => $tag->uuid,
                    'name' => $tag->name,
                    'slug' => $tag->slug,
                ])
            ),
            'seo' => [
                'title' => $this->seo_title,
                'description' => $this->seo_description,
                'keywords' => $this->seo_keywords,
            ],
            'flags' => [
                'is_featured' => $this->is_featured,
                'is_pinned' => $this->is_pinned,
                'is_commentable' => $this->is_commentable,
            ],
            'metadata' => $this->metadata,
            'view_count' => $this->view_count,
            'comment_count' => $this->comment_count,
            'published_at' => $this->published_at?->toIso8601String(),
            'scheduled_publish_at' => $this->scheduled_publish_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
