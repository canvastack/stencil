<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Url;

use Plugins\PagesEngine\Domain\Services\ContentUrlBuilder;
use Plugins\PagesEngine\Domain\ValueObjects\UrlPattern;

final class PreviewUrlUseCase
{
    public function __construct(
        private readonly ContentUrlBuilder $urlBuilder
    ) {}

    public function execute(string $pattern, array $sampleData = []): string
    {
        return $this->urlBuilder->previewUrl(
            new UrlPattern($pattern),
            $sampleData
        );
    }
}
