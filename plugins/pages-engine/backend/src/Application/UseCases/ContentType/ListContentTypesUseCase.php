<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\ContentType;

use Plugins\PagesEngine\Application\Responses\ContentTypeResponse;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class ListContentTypesUseCase
{
    public function __construct(
        private readonly ContentTypeRepositoryInterface $contentTypeRepository
    ) {}

    public function execute(?string $tenantId, ?string $scope = null, ?bool $isActive = null): array
    {
        if ($scope === 'platform' || $tenantId === null) {
            $contentTypes = $this->contentTypeRepository->findPlatformContentTypes();
        } else {
            $contentTypes = $this->contentTypeRepository->findByTenant(new Uuid($tenantId));
        }
        
        if ($isActive !== null) {
            $contentTypes = array_filter($contentTypes, fn($ct) => $ct->isActive() === $isActive);
        }
        
        return array_map(
            fn($contentType) => ContentTypeResponse::fromEntity($contentType),
            array_values($contentTypes)
        );
    }
}
