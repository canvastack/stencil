<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\ValueObjects;

use Plugins\PagesEngine\Domain\Exceptions\InvalidUrlPatternException;

final class UrlPattern
{
    private const ALLOWED_PLACEHOLDERS = [
        'slug',
        'category',
        'year',
        'month',
        'day',
        'author',
        'content_type',
        'id'
    ];

    private string $pattern;
    private array $placeholders;

    public function __construct(string $pattern)
    {
        $this->validate($pattern);
        $this->pattern = $pattern;
        $this->placeholders = $this->extractPlaceholders($pattern);
    }

    private function validate(string $pattern): void
    {
        if (empty($pattern)) {
            throw InvalidUrlPatternException::empty();
        }

        $placeholders = $this->extractPlaceholders($pattern);

        foreach ($placeholders as $placeholder) {
            if (!in_array($placeholder, self::ALLOWED_PLACEHOLDERS, true)) {
                throw InvalidUrlPatternException::invalidPlaceholder($placeholder);
            }
        }

        if (!in_array('slug', $placeholders, true)) {
            throw InvalidUrlPatternException::missingRequiredPlaceholder('slug');
        }
    }

    private function extractPlaceholders(string $pattern): array
    {
        preg_match_all('/\{([a-z_]+)\}/', $pattern, $matches);
        return $matches[1] ?? [];
    }

    public function getPattern(): string
    {
        return $this->pattern;
    }

    public function getPlaceholders(): array
    {
        return $this->placeholders;
    }

    public function compile(array $data): string
    {
        $url = $this->pattern;

        foreach ($this->placeholders as $placeholder) {
            $value = $data[$placeholder] ?? '';
            $url = str_replace("{{$placeholder}}", $value, $url);
        }

        return $url;
    }

    public function preview(array $sampleData): string
    {
        $defaults = [
            'slug' => 'sample-content',
            'category' => 'category',
            'year' => date('Y'),
            'month' => date('m'),
            'day' => date('d'),
            'author' => 'author',
            'content_type' => 'blog',
            'id' => '1'
        ];

        $data = array_merge($defaults, $sampleData);
        return $this->compile($data);
    }

    public function equals(self $other): bool
    {
        return $this->pattern === $other->pattern;
    }

    public function __toString(): string
    {
        return $this->pattern;
    }
}
