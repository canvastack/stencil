<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Content;

use Plugins\PagesEngine\Application\Responses\ContentResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\ContentSlug;
use RuntimeException;

final class GetContentUseCase
{
    public function __construct(
        private readonly ContentRepositoryInterface $contentRepository
    ) {}

    public function execute(string $uuid, string $tenantId): ContentResponse
    {
        $content = $this->contentRepository->findById(new Uuid($uuid));
        
        if (!$content) {
            throw new RuntimeException("Content not found");
        }
        
        if ($content->getTenantId()->getValue() !== $tenantId) {
            throw new RuntimeException("Content not found");
        }

        return ContentResponse::fromEntity($content);
    }

    public function executeBySlug(string $slug): ?ContentResponse
    {
        $tenantId = request()->header('X-Tenant-ID');
        if (!$tenantId) {
            throw new RuntimeException("Tenant context not available");
        }

        $content = $this->contentRepository->findBySlug(
            new ContentSlug($slug),
            new Uuid($tenantId)
        );
        
        if (!$content) {
            return null;
        }

        return ContentResponse::fromEntity($content);
    }
}
