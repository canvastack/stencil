<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\ContentType;

use Plugins\PagesEngine\Application\Commands\DeleteContentTypeCommand;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use InvalidArgumentException;

final class DeleteContentTypeUseCase
{
    public function __construct(
        private readonly ContentTypeRepositoryInterface $contentTypeRepository,
        private readonly ContentRepositoryInterface $contentRepository
    ) {}

    public function execute(DeleteContentTypeCommand $command): void
    {
        $contentType = $this->contentTypeRepository->findById($command->contentTypeId);
        
        if (!$contentType) {
            throw new InvalidArgumentException("Content type not found");
        }

        if ($contentType->getTenantId() && !$contentType->getTenantId()->equals($command->tenantId)) {
            throw new InvalidArgumentException("Unauthorized access to content type");
        }

        $hasContents = $this->contentRepository->countByContentType($command->contentTypeId) > 0;
        
        if ($hasContents) {
            throw new InvalidArgumentException("Cannot delete content type with existing contents. Please remove or reassign all contents first.");
        }

        $contentType->deactivate();
        $this->contentTypeRepository->save($contentType);
    }
}
