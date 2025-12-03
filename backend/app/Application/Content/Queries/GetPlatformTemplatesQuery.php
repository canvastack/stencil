<?php

namespace App\Application\Content\Queries;

/**
 * Get Platform Templates Query
 * 
 * Query DTO for retrieving platform content blocks/templates available to tenants.
 */
class GetPlatformTemplatesQuery
{
    public function __construct(
        public readonly ?string $category = null,
        public readonly ?string $search = null,
        public readonly bool $only_active = true,
        public readonly bool $only_templates = true,
        public readonly int $page = 1,
        public readonly int $per_page = 15,
        public readonly string $sort_by = 'name',
        public readonly string $sort_order = 'asc'
    ) {}

    public function getFilters(): array
    {
        return array_filter([
            'category' => $this->category,
            'search' => $this->search,
            'is_active' => $this->only_active ? true : null,
            'is_template' => $this->only_templates ? true : null,
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