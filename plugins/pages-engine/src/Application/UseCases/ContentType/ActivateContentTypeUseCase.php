<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\ContentType;

use Plugins\PagesEngine\Application\Responses\ContentTypeResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use RuntimeException;

final class ActivateContentTypeUseCase
{
    public function __construct(
        private readonly ContentTypeRepositoryInterface $contentTypeRepository
    ) {}

    public function execute(string $uuid, string $tenantId): ContentTypeResponse
    {
        $contentType = $this->contentTypeRepository->findByUuid(new Uuid($uuid), $tenantId);
        
        if (!$contentType) {
            throw new RuntimeException("Content type not found");
        }

        $contentType->activate();
        $this->contentTypeRepository->save($contentType);

        return ContentTypeResponse::fromEntity($contentType);
    }
}
