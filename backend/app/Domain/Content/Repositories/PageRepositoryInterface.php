<?php

namespace App\Domain\Content\Repositories;

use App\Domain\Content\Entities\Page;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Tenant Page Repository Interface
 * 
 * Defines contract for tenant page data operations.
 * All operations are automatically tenant-scoped.
 */
interface PageRepositoryInterface
{
    /**
     * Find all tenant pages with optional filters
     */
    public function findAll(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Find tenant page by UUID
     */
    public function findByUuid(string $uuid): ?Page;

    /**
     * Find tenant page by slug and language
     */
    public function findBySlug(string $slug, string $language = 'id'): ?Page;

    /**
     * Find homepage for given language
     */
    public function findHomepage(string $language = 'id'): ?Page;

    /**
     * Find published pages
     */
    public function findPublished(array $filters = []): Collection;

    /**
     * Find pages by status
     */
    public function findByStatus(string $status, int $perPage = 15): LengthAwarePaginator;

    /**
     * Find pages created from platform template
     */
    public function findByPlatformTemplate(int $templateId): Collection;

    /**
     * Create new tenant page
     */
    public function create(array $data): Page;

    /**
     * Create page from platform template
     */
    public function createFromPlatformTemplate(int $templateId, array $data): Page;

    /**
     * Update tenant page
     */
    public function update(Page $page, array $data): Page;

    /**
     * Delete tenant page
     */
    public function delete(Page $page): bool;

    /**
     * Find or create page by slug
     */
    public function findOrCreate(string $slug, array $data): Page;

    /**
     * Search pages by title or content
     */
    public function search(string $query, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get page tree structure
     */
    public function getPageTree(string $language = 'id'): Collection;

    /**
     * Bulk update page order
     */
    public function updateOrder(array $orderMapping): bool;

    /**
     * Get page statistics
     */
    public function getStatistics(): array;

    /**
     * Get pages that need platform template updates
     */
    public function getPagesNeedingTemplateUpdates(): Collection;
}