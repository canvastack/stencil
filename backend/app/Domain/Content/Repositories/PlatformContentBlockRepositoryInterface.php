<?php

namespace App\Domain\Content\Repositories;

use App\Domain\Content\Entities\PlatformContentBlock;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Platform Content Block Repository Interface
 * 
 * Defines contract for platform content block data operations.
 */
interface PlatformContentBlockRepositoryInterface
{
    /**
     * Find all content blocks with optional filters
     */
    public function findAll(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Find content block by ID
     */
    public function findById(int $id): ?PlatformContentBlock;

    /**
     * Find content block by identifier
     */
    public function findByIdentifier(string $identifier): ?PlatformContentBlock;

    /**
     * Find active content blocks
     */
    public function findActive(): Collection;

    /**
     * Find blocks available as templates to tenants
     */
    public function findAvailableTemplates(): Collection;

    /**
     * Find blocks by category
     */
    public function findByCategory(string $category): Collection;

    /**
     * Create new content block
     */
    public function create(array $data): PlatformContentBlock;

    /**
     * Update content block
     */
    public function update(PlatformContentBlock $block, array $data): PlatformContentBlock;

    /**
     * Delete content block
     */
    public function delete(PlatformContentBlock $block): bool;

    /**
     * Get all categories
     */
    public function getCategories(): Collection;

    /**
     * Search blocks by name or description
     */
    public function search(string $query, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get block usage statistics (how many tenants use each template)
     */
    public function getUsageStatistics(): array;
}