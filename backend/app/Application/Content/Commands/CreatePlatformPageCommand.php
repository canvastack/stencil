<?php

namespace App\Application\Content\Commands;

/**
 * Create Platform Page Command
 * 
 * Command DTO for creating new platform pages.
 * Contains all data needed to create a platform page.
 */
class CreatePlatformPageCommand
{
    public function __construct(
        public readonly string $title,
        public readonly ?string $slug = null,
        public readonly ?string $description = null,
        public readonly array $content = [],
        public readonly string $template = 'default',
        public readonly array $meta_data = [],
        public readonly string $status = 'draft',
        public readonly bool $is_homepage = false,
        public readonly int $sort_order = 0,
        public readonly string $language = 'en',
        public readonly ?int $parent_id = null,
        public readonly int $created_by = 0
    ) {}

    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'content' => $this->content,
            'template' => $this->template,
            'meta_data' => $this->meta_data,
            'status' => $this->status,
            'is_homepage' => $this->is_homepage,
            'sort_order' => $this->sort_order,
            'language' => $this->language,
            'parent_id' => $this->parent_id,
            'created_by' => $this->created_by
        ];
    }
}