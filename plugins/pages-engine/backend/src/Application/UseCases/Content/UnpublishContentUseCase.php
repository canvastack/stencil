<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Content;

use Plugins\PagesEngine\Application\Commands\UnpublishContentCommand;
use Plugins\PagesEngine\Application\Responses\ContentResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use Plugins\PagesEngine\Domain\Events\ContentUnpublished;
use InvalidArgumentException;

final class UnpublishContentUseCase
{
    public function __construct(
        private readonly ContentRepositoryInterface $contentRepository
    ) {}

    public function execute(UnpublishContentCommand $command): ContentResponse
    {
        $content = $this->contentRepository->findById($command->contentId);
        
        if (!$content) {
            throw new InvalidArgumentException("Content not found");
        }

        if (!$content->getTenantId()->equals($command->tenantId)) {
            throw new InvalidArgumentException("Unauthorized access to content");
        }

        $content->unpublish();
        $this->contentRepository->save($content);

        return ContentResponse::fromEntity($content);
    }
}
