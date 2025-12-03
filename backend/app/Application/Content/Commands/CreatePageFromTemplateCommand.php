<?php

namespace App\Application\Content\Commands;

/**
 * Create Page From Template Command
 * 
 * Command DTO for creating tenant pages from platform templates.
 * Handles template inheritance and customization.
 */
class CreatePageFromTemplateCommand
{
    public function __construct(
        public readonly int $platform_template_id,
        public readonly string $title,
        public readonly ?string $slug = null,
        public readonly ?string $description = null,
        public readonly array $customizations = [],
        public readonly array $meta_data = [],
        public readonly string $status = 'draft',
        public readonly bool $is_homepage = false,
        public readonly int $sort_order = 0,
        public readonly string $language = 'id',
        public readonly ?int $parent_id = null
    ) {}

    public function toArray(): array
    {
        return [
            'platform_template_id' => $this->platform_template_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'customizations' => $this->customizations,
            'meta_data' => $this->meta_data,
            'status' => $this->status,
            'is_homepage' => $this->is_homepage,
            'sort_order' => $this->sort_order,
            'language' => $this->language,
            'parent_id' => $this->parent_id
        ];
    }
}