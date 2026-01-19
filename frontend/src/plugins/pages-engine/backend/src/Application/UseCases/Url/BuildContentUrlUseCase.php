<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Url;

use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use Plugins\PagesEngine\Domain\Repositories\ContentTypeRepositoryInterface;
use Plugins\PagesEngine\Domain\Services\ContentUrlBuilder;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use RuntimeException;

final class BuildContentUrlUseCase
{
    public function __construct(
        private readonly ContentRepositoryInterface $contentRepository,
        private readonly ContentTypeRepositoryInterface $contentTypeRepository,
        private readonly ContentUrlBuilder $urlBuilder
    ) {}

    public function execute(string $contentUuid): string
    {
        $content = $this->contentRepository->findByUuid(new Uuid($contentUuid));
        
        if (!$content) {
            throw new RuntimeException("Content not found");
        }

        $contentType = $this->contentTypeRepository->findByUuid($content->getContentTypeId());
        
        if (!$contentType) {
            throw new RuntimeException("Content type not found");
        }

        return $this->urlBuilder->buildUrlFromContentType($contentType, $content);
    }
}
