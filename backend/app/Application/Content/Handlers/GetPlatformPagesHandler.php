<?php

namespace App\Application\Content\Handlers;

use App\Application\Content\Queries\GetPlatformPagesQuery;
use App\Domain\Content\Repositories\PlatformPageRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Get Platform Pages Query Handler
 * 
 * Handles retrieving platform pages with filtering, pagination and sorting.
 */
class GetPlatformPagesHandler
{
    public function __construct(
        private readonly PlatformPageRepositoryInterface $pageRepository
    ) {}

    public function handle(GetPlatformPagesQuery $query): LengthAwarePaginator
    {
        $filters = $query->getFilters();
        $perPage = $query->per_page;

        return $this->pageRepository->findAll($filters, $perPage);
    }
}