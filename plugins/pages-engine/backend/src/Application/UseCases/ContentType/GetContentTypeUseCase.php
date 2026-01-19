<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\ContentType;

use Plugins\PagesEngine\Application\Responses\ContentTypeResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use RuntimeException;

final class GetContentTypeUseCase
{
    public function __construct(
        private readonly ContentTypeRepositoryInterface $contentTypeRepository
    ) {}

    public function execute(string $uuid, string $tenantId): ContentTypeResponse
    {
        $contentType = $this->contentTypeRepository->findById(new Uuid($uuid));
        
        if (!$contentType) {
            throw new RuntimeException("Content type not found");
        }
        
        if ($contentType->getTenantId() && $contentType->getTenantId()->getValue() !== $tenantId) {
            throw new RuntimeException("Content type not found");
        }

        return ContentTypeResponse::fromEntity($contentType);
    }
}
