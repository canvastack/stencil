<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Content;

use Plugins\PagesEngine\Application\Responses\ContentResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
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
}
