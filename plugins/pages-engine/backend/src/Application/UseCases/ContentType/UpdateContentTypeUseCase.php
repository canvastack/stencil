<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\ContentType;

use Plugins\PagesEngine\Application\Commands\UpdateContentTypeCommand;
use Plugins\PagesEngine\Application\Responses\ContentTypeResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\ContentTypeSlug;
use Plugins\PagesEngine\Domain\ValueObjects\UrlPattern;
use InvalidArgumentException;

final class UpdateContentTypeUseCase
{
    public function __construct(
        private readonly ContentTypeRepositoryInterface $contentTypeRepository
    ) {}

    public function execute(UpdateContentTypeCommand $command): ContentTypeResponse
    {
        $contentType = $this->contentTypeRepository->findById($command->contentTypeId);
        
        if (!$contentType) {
            throw new InvalidArgumentException("Content type not found");
        }

        if ($contentType->getTenantId() && !$contentType->getTenantId()->equals($command->tenantId)) {
            throw new InvalidArgumentException("Unauthorized access to content type");
        }

        if ($command->slug !== null) {
            $newSlug = new ContentTypeSlug($command->slug);
            $existingType = $this->contentTypeRepository->findBySlug($newSlug, $command->tenantId);
            
            if ($existingType && !$existingType->getId()->equals($command->contentTypeId)) {
                throw new InvalidArgumentException("Content type with slug '{$command->slug}' already exists");
            }
            
            $contentType->updateSlug($newSlug);
        }

        if ($command->name !== null) {
            $contentType->updateName($command->name);
        }

        if ($command->defaultUrlPattern !== null) {
            $contentType->updateUrlPattern(new UrlPattern($command->defaultUrlPattern));
        }

        if ($command->description !== null) {
            $contentType->updateDescription($command->description);
        }

        if ($command->icon !== null) {
            $contentType->updateIcon($command->icon);
        }

        if ($command->isCommentable !== null) {
            $command->isCommentable ? $contentType->enableComments() : $contentType->disableComments();
        }

        if ($command->isCategorizable !== null) {
            $command->isCategorizable ? $contentType->enableCategories() : $contentType->disableCategories();
        }

        if ($command->isTaggable !== null) {
            $command->isTaggable ? $contentType->enableTags() : $contentType->disableTags();
        }

        if ($command->isRevisioned !== null) {
            $command->isRevisioned ? $contentType->enableRevisions() : $contentType->disableRevisions();
        }

        if ($command->metadata !== null) {
            $contentType->updateMetadata($command->metadata);
        }

        $this->contentTypeRepository->save($contentType);

        return ContentTypeResponse::fromEntity($contentType);
    }
}
