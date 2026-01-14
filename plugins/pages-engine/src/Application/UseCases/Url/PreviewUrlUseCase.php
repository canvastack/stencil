<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\UseCases\Url;

use Plugins\PagesEngine\Domain\Services\UrlGenerator;

final class PreviewUrlUseCase
{
    public function __construct(
        private readonly UrlGenerator $urlGenerator
    ) {}

    public function execute(array $data): string
    {
        return $this->urlGenerator->preview($data);
    }
}
