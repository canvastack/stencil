<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Revision;

use Plugins\PagesEngine\Application\Responses\ContentResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentRevisionRepositoryInterface;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use RuntimeException;

final class RevertRevisionUseCase
{
    public function __construct(
        private readonly ContentRevisionRepositoryInterface $revisionRepository,
        private readonly ContentRepositoryInterface $contentRepository
    ) {}

    public function execute(string $revisionUuid, string $tenantId): ContentResponse
    {
        $revision = $this->revisionRepository->findByUuid(new Uuid($revisionUuid), $tenantId);
        
        if (!$revision) {
            throw new RuntimeException("Revision not found");
        }

        $content = $this->contentRepository->findById($revision->getContentId());
        
        if (!$content) {
            throw new RuntimeException("Content not found");
        }

        $content->revertToRevision($revision);
        $this->contentRepository->save($content);

        return ContentResponse::fromEntity($content);
    }
}
