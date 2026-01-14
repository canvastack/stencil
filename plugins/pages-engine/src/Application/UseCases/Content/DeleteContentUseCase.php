<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Content;

use Plugins\PagesEngine\Application\Commands\DeleteContentCommand;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use InvalidArgumentException;

final class DeleteContentUseCase
{
    public function __construct(
        private readonly ContentRepositoryInterface $contentRepository
    ) {}

    public function execute(DeleteContentCommand $command): void
    {
        $content = $this->contentRepository->findById($command->contentId);
        
        if (!$content) {
            throw new InvalidArgumentException("Content not found");
        }

        if (!$content->getTenantId()->equals($command->tenantId)) {
            throw new InvalidArgumentException("Unauthorized access to content");
        }

        $content->trash();
        $this->contentRepository->save($content);
    }
}
