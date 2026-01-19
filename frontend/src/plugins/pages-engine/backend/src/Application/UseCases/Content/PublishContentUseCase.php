<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Content;

use Plugins\PagesEngine\Application\Commands\PublishContentCommand;
use Plugins\PagesEngine\Application\Responses\ContentResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use Plugins\PagesEngine\Domain\Events\ContentPublished;
use InvalidArgumentException;

final class PublishContentUseCase
{
    public function __construct(
        private readonly ContentRepositoryInterface $contentRepository
    ) {}

    public function execute(PublishContentCommand $command): ContentResponse
    {
        $content = $this->contentRepository->findById($command->contentId);
        
        if (!$content) {
            throw new InvalidArgumentException("Content not found");
        }

        if (!$content->getTenantId()->equals($command->tenantId)) {
            throw new InvalidArgumentException("Unauthorized access to content");
        }

        $content->publish();
        $this->contentRepository->save($content);

        return ContentResponse::fromEntity($content);
    }
}
