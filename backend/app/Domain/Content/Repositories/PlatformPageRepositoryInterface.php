<?php

namespace App\Domain\Content\Repositories;

use App\Domain\Content\Entities\PlatformPage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Platform Page Repository Interface
 * 
 * Defines contract for platform page data operations.
 * Implementation will be in Infrastructure layer.
 */
interface PlatformPageRepositoryInterface
{
    /**
     * Find all platform pages with optional filters
     */
    public function findAll(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Find platform page by UUID
     */
    public function findByUuid(string $uuid): ?PlatformPage;

    /**
     * Find platform page by slug and language
     */
    public function findBySlug(string $slug, string $language = 'en'): ?PlatformPage;

    /**
     * Find homepage for given language
     */
    public function findHomepage(string $language = 'en'): ?PlatformPage;

    /**
     * Find published pages
     */
    public function findPublished(array $filters = []): Collection;

    /**
     * Find pages by status
     */
    public function findByStatus(string $status, int $perPage = 15): LengthAwarePaginator;

    /**
     * Create new platform page
     */
    public function create(array $data): PlatformPage;

    /**
     * Update platform page
     */
    public function update(PlatformPage $page, array $data): PlatformPage;

    /**
     * Delete platform page
     */
    public function delete(PlatformPage $page): bool;

    /**
     * Find or create page by slug
     */
    public function findOrCreate(string $slug, array $data): PlatformPage;

    /**
     * Search pages by title or content
     */
    public function search(string $query, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get page tree structure
     */
    public function getPageTree(string $language = 'en'): Collection;

    /**
     * Get pages that can be used as templates by tenants
     */
    public function getAvailableTemplates(): Collection;

    /**
     * Bulk update page order
     */
    public function updateOrder(array $orderMapping): bool;

    /**
     * Get page statistics
     */
    public function getStatistics(): array;
}