<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\ContentType;

use Plugins\PagesEngine\Application\Commands\CreateContentTypeCommand;
use Plugins\PagesEngine\Application\Responses\ContentTypeResponse;
use Plugins\PagesEngine\Domain\Entities\ContentType;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\ContentTypeSlug;
use Plugins\PagesEngine\Domain\ValueObjects\UrlPattern;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use InvalidArgumentException;

final class CreateContentTypeUseCase
{
    public function __construct(
        private readonly ContentTypeRepositoryInterface $contentTypeRepository
    ) {}

    public function execute(CreateContentTypeCommand $command): ContentTypeResponse
    {
        $slug = new ContentTypeSlug($command->slug);
        $existingType = $this->contentTypeRepository->findBySlug($slug, $command->tenantId);
        
        if ($existingType) {
            throw new InvalidArgumentException("Content type with slug '{$command->slug}' already exists");
        }

        $contentType = new ContentType(
            id: new Uuid(\Ramsey\Uuid\Uuid::uuid4()->toString()),
            tenantId: $command->tenantId,
            name: $command->name,
            slug: $slug,
            defaultUrlPattern: new UrlPattern($command->defaultUrlPattern),
            scope: $command->scope,
            description: $command->description,
            icon: $command->icon,
            isCommentable: $command->isCommentable,
            isCategorizable: $command->isCategorizable,
            isTaggable: $command->isTaggable,
            isRevisioned: $command->isRevisioned,
            isActive: true,
            metadata: $command->metadata
        );

        $this->contentTypeRepository->save($contentType);

        return ContentTypeResponse::fromEntity($contentType);
    }
}
