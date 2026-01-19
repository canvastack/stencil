<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Responses;

final class ContentListResponse
{
    public function __construct(
        public readonly array $data,
        public readonly int $total,
        public readonly int $perPage,
        public readonly int $currentPage,
        public readonly int $lastPage,
        public readonly ?string $nextPageUrl,
        public readonly ?string $prevPageUrl
    ) {}

    public static function fromPaginator(array $items, int $total, int $perPage, int $currentPage): self
    {
        $lastPage = (int) ceil($total / $perPage);
        
        return new self(
            data: $items,
            total: $total,
            perPage: $perPage,
            currentPage: $currentPage,
            lastPage: $lastPage,
            nextPageUrl: $currentPage < $lastPage ? "?page=" . ($currentPage + 1) : null,
            prevPageUrl: $currentPage > 1 ? "?page=" . ($currentPage - 1) : null
        );
    }
}
