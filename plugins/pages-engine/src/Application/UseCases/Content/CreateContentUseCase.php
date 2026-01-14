<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Content;

use Plugins\PagesEngine\Application\Commands\CreateContentCommand;
use Plugins\PagesEngine\Application\Responses\ContentResponse;
use Plugins\PagesEngine\Domain\Entities\Content;
use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\Services\SlugGenerator;
use Plugins\PagesEngine\Domain\Services\RevisionManager;
use Plugins\PagesEngine\Domain\ValueObjects\ContentSlug;
use Plugins\PagesEngine\Domain\ValueObjects\ContentStatus;
use Plugins\PagesEngine\Domain\ValueObjects\EditorFormat;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use InvalidArgumentException;

final class CreateContentUseCase
{
    public function __construct(
        private readonly ContentRepositoryInterface $contentRepository,
        private readonly ContentTypeRepositoryInterface $contentTypeRepository,
        private readonly SlugGenerator $slugGenerator,
        private readonly RevisionManager $revisionManager
    ) {}

    public function execute(CreateContentCommand $command): ContentResponse
    {
        $contentType = $this->contentTypeRepository->findById($command->contentTypeId);
        if (!$contentType) {
            throw new InvalidArgumentException("Content type not found");
        }

        $slug = $command->slug 
            ? new ContentSlug($command->slug)
            : $this->slugGenerator->generateFromTitle($command->title, $command->tenantId);

        if ($this->contentRepository->slugExists($slug, $command->tenantId)) {
            throw new InvalidArgumentException("Content with slug '{$slug->getValue()}' already exists");
        }

        $content = new Content(
            id: new Uuid(\Ramsey\Uuid\Uuid::uuid4()->toString()),
            tenantId: $command->tenantId,
            contentTypeId: $command->contentTypeId,
            authorId: $command->authorId,
            title: $command->title,
            slug: $slug,
            content: $command->content,
            contentFormat: new EditorFormat($command->contentFormat),
            excerpt: $command->excerpt,
            featuredImageId: $command->featuredImageId,
            status: new ContentStatus(ContentStatus::DRAFT),
            customUrl: $command->customUrl,
            isCommentable: $command->isCommentable ?? $contentType->allowsComments(),
            seoTitle: $command->seoTitle,
            seoDescription: $command->seoDescription,
            seoKeywords: $command->seoKeywords,
            metadata: $command->metadata
        );

        $this->contentRepository->save($content);

        if ($contentType->supportsRevisions()) {
            $this->revisionManager->createRevision($content, $command->authorId);
        }

        return ContentResponse::fromEntity($content);
    }
}
