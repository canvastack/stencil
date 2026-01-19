<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Content;

use Plugins\PagesEngine\Application\Commands\UpdateContentCommand;
use Plugins\PagesEngine\Application\Responses\ContentResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\Services\RevisionManager;
use Plugins\PagesEngine\Domain\ValueObjects\ContentSlug;
use Plugins\PagesEngine\Domain\ValueObjects\EditorFormat;
use InvalidArgumentException;

final class UpdateContentUseCase
{
    public function __construct(
        private readonly ContentRepositoryInterface $contentRepository,
        private readonly ContentTypeRepositoryInterface $contentTypeRepository,
        private readonly RevisionManager $revisionManager
    ) {}

    public function execute(UpdateContentCommand $command): ContentResponse
    {
        $content = $this->contentRepository->findById($command->contentId);
        
        if (!$content) {
            throw new InvalidArgumentException("Content not found");
        }

        if (!$content->getTenantId()->equals($command->tenantId)) {
            throw new InvalidArgumentException("Unauthorized access to content");
        }

        $hasChanges = false;

        if ($command->title !== null) {
            $content->updateTitle($command->title);
            $hasChanges = true;
        }

        if ($command->slug !== null) {
            $newSlug = new ContentSlug($command->slug);
            if ($this->contentRepository->slugExists($newSlug, $command->tenantId, $command->contentId)) {
                throw new InvalidArgumentException("This slug is already used for another content");
            }
            $content->updateSlug($newSlug);
            $hasChanges = true;
        }

        if ($command->content !== null) {
            $content->updateContent($command->content);
            $hasChanges = true;
        }

        if ($command->contentFormat !== null) {
            $content->updateContentFormat(new EditorFormat($command->contentFormat));
            $hasChanges = true;
        }

        if ($command->excerpt !== null) {
            $content->updateExcerpt($command->excerpt);
            $hasChanges = true;
        }

        if ($command->featuredImageId !== null) {
            $content->updateFeaturedImage($command->featuredImageId);
            $hasChanges = true;
        }

        if ($command->customUrl !== null) {
            $content->updateCustomUrl($command->customUrl);
            $hasChanges = true;
        }

        if ($command->isCommentable !== null) {
            $command->isCommentable ? $content->enableComments() : $content->disableComments();
            $hasChanges = true;
        }

        if ($command->seoTitle !== null) {
            $content->updateSeoTitle($command->seoTitle);
            $hasChanges = true;
        }

        if ($command->seoDescription !== null) {
            $content->updateSeoDescription($command->seoDescription);
            $hasChanges = true;
        }

        if ($command->seoKeywords !== null) {
            $content->updateSeoKeywords($command->seoKeywords);
            $hasChanges = true;
        }

        if ($command->metadata !== null) {
            $content->updateMetadata($command->metadata);
            $hasChanges = true;
        }

        $this->contentRepository->save($content);

        if ($hasChanges) {
            $contentType = $this->contentTypeRepository->findById($content->getContentTypeId());
            if ($contentType && $contentType->supportsRevisions()) {
                $this->revisionManager->createRevision($content, $content->getAuthorId());
            }
        }

        return ContentResponse::fromEntity($content);
    }
}
