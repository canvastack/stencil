<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Revision;

use Plugins\PagesEngine\Application\Responses\RevisionResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentRevisionRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use RuntimeException;

final class GetRevisionUseCase
{
    public function __construct(
        private readonly ContentRevisionRepositoryInterface $contentrevisionRepository
    ) {}

    public function execute(string $uuid, string $tenantId): RevisionResponse
    {
        $contentrevision = $this->contentrevisionRepository->findById(new Uuid($uuid));
        
        if (!$contentrevision) {
            throw new RuntimeException("ContentRevision not found");
        }

        return RevisionResponse::fromEntity($contentrevision);
    }
}
