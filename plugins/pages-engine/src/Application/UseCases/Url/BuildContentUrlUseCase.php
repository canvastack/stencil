<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Url;

use Plugins\PagesEngine\Domain\Repositories\ContentRepositoryInterface;
use Plugins\PagesEngine\Domain\Services\UrlGenerator;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use RuntimeException;

final class BuildContentUrlUseCase
{
    public function __construct(
        private readonly ContentRepositoryInterface $contentRepository,
        private readonly UrlGenerator $urlGenerator
    ) {}

    public function execute(string $contentUuid): string
    {
        $content = $this->contentRepository->findByUuid(new Uuid($contentUuid));
        
        if (!$content) {
            throw new RuntimeException("Content not found");
        }

        return $this->urlGenerator->generate($content);
    }
}
