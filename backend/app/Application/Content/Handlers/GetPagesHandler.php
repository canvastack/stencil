<?php

namespace App\Application\Content\Handlers;

use App\Application\Content\Queries\GetPagesQuery;
use App\Domain\Content\Repositories\PageRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Get Tenant Pages Query Handler
 * 
 * Handles retrieving tenant pages with filtering, pagination and sorting.
 * All results are automatically tenant-scoped.
 */
class GetPagesHandler
{
    public function __construct(
        private readonly PageRepositoryInterface $pageRepository
    ) {}

    public function handle(GetPagesQuery $query): LengthAwarePaginator
    {
        $filters = $query->getFilters();
        $perPage = $query->per_page;

        return $this->pageRepository->findAll($filters, $perPage);
    }
}