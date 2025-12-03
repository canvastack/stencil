<?php

namespace App\Application\Content\Commands;

/**
 * Update Platform Page Command
 * 
 * Command DTO for updating existing platform pages.
 */
class UpdatePlatformPageCommand
{
    public function __construct(
        public readonly string $uuid,
        public readonly ?string $title = null,
        public readonly ?string $slug = null,
        public readonly ?string $description = null,
        public readonly ?array $content = null,
        public readonly ?string $template = null,
        public readonly ?array $meta_data = null,
        public readonly ?string $status = null,
        public readonly ?bool $is_homepage = null,
        public readonly ?int $sort_order = null,
        public readonly ?string $language = null,
        public readonly ?int $parent_id = null,
        public readonly ?string $change_description = null
    ) {}

    public function toArray(): array
    {
        return array_filter([
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
        ], fn($value) => $value !== null);
    }
}