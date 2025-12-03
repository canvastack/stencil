<?php

namespace App\Application\Content\Queries;

/**
 * Get Tenant Pages Query
 * 
 * Query DTO for retrieving tenant pages with filters.
 * All results are automatically tenant-scoped.
 */
class GetPagesQuery
{
    public function __construct(
        public readonly ?string $status = null,
        public readonly ?string $language = null,
        public readonly ?int $parent_id = null,
        public readonly ?string $search = null,
        public readonly ?bool $is_homepage = null,
        public readonly ?string $template = null,
        public readonly ?int $platform_template_id = null,
        public readonly int $page = 1,
        public readonly int $per_page = 15,
        public readonly string $sort_by = 'created_at',
        public readonly string $sort_order = 'desc'
    ) {}

    public function getFilters(): array
    {
        return array_filter([
            'status' => $this->status,
            'language' => $this->language,
            'parent_id' => $this->parent_id,
            'search' => $this->search,
            'is_homepage' => $this->is_homepage,
            'template' => $this->template,
            'platform_template_id' => $this->platform_template_id,
        ], fn($value) => $value !== null);
    }

    public function getPaginationParams(): array
    {
        return [
            'page' => $this->page,
            'per_page' => $this->per_page,
            'sort_by' => $this->sort_by,
            'sort_order' => $this->sort_order
        ];
    }
}