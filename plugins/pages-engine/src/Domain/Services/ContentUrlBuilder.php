<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Services;

use Plugins\PagesEngine\Domain\ValueObjects\UrlPattern;
use Plugins\PagesEngine\Domain\Entities\Content;
use Plugins\PagesEngine\Domain\Entities\ContentCategory;
use Plugins\PagesEngine\Domain\Entities\ContentType;

final class ContentUrlBuilder
{
    public function buildUrl(
        UrlPattern $pattern,
        Content $content,
        ?ContentCategory $category = null
    ): string {
        $placeholders = $pattern->getPlaceholders();
        $data = $this->preparePlaceholderData($content, $category);

        return $pattern->compile($data);
    }

    public function buildUrlFromContentType(
        ContentType $contentType,
        Content $content,
        ?ContentCategory $category = null
    ): string {
        return $this->buildUrl($contentType->getDefaultUrlPattern(), $content, $category);
    }

    private function preparePlaceholderData(
        Content $content,
        ?ContentCategory $category
    ): array {
        $publishedAt = $content->getPublishedAt() ?? $content->getCreatedAt();

        return [
            'slug' => $content->getSlug()->getValue(),
            'category' => $category?->getSlug()->getValue() ?? '',
            'year' => $publishedAt->format('Y'),
            'month' => $publishedAt->format('m'),
            'day' => $publishedAt->format('d'),
            'content_type' => '',
            'id' => $content->getId()->getValue()
        ];
    }

    public function previewUrl(
        UrlPattern $pattern,
        array $sampleData = []
    ): string {
        return $pattern->preview($sampleData);
    }
}
