<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Content;

use Plugins\PagesEngine\Application\Commands\RevertContentRevisionCommand;
use Plugins\PagesEngine\Application\Responses\ContentResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use Plugins\PagesEngine\Domain\Repositories\ContentRevisionRepositoryInterface;
use Plugins\PagesEngine\Domain\Services\RevisionManager;
use InvalidArgumentException;

final class RevertContentRevisionUseCase
{
    public function __construct(
        private readonly ContentRepositoryInterface $contentRepository,
        private readonly ContentRevisionRepositoryInterface $revisionRepository,
        private readonly RevisionManager $revisionManager
    ) {}

    public function execute(RevertContentRevisionCommand $command): ContentResponse
    {
        $content = $this->contentRepository->findById($command->contentId);
        
        if (!$content) {
            throw new InvalidArgumentException("Content not found");
        }

        if (!$content->getTenantId()->equals($command->tenantId)) {
            throw new InvalidArgumentException("Unauthorized access to content");
        }

        $revision = $this->revisionRepository->findById($command->revisionId);
        
        if (!$revision) {
            throw new InvalidArgumentException("Revision not found");
        }

        if (!$revision->getContentId()->equals($command->contentId)) {
            throw new InvalidArgumentException("Revision does not belong to this content");
        }

        $this->revisionManager->revertToRevision($content, $revision);
        $this->contentRepository->save($content);

        return ContentResponse::fromEntity($content);
    }
}
