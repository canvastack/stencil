<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\ValueObjects;

use InvalidArgumentException;

final class EditorFormat
{
    public const WYSIWYG = 'wysiwyg';
    public const MARKDOWN = 'markdown';
    public const HTML = 'html';
    public const PLAINTEXT = 'plaintext';

    private const ALLOWED_VALUES = [
        self::WYSIWYG,
        self::MARKDOWN,
        self::HTML,
        self::PLAINTEXT
    ];

    private const FORMATS_WITH_PREVIEW = [
        self::WYSIWYG,
        self::MARKDOWN,
        self::HTML
    ];

    private const FORMATS_REQUIRING_COMPILATION = [
        self::MARKDOWN
    ];

    private string $value;

    public function __construct(string $value)
    {
        if (!in_array($value, self::ALLOWED_VALUES, true)) {
            throw new InvalidArgumentException("Invalid editor format: {$value}");
        }

        $this->value = $value;
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function isWysiwyg(): bool
    {
        return $this->value === self::WYSIWYG;
    }

    public function isMarkdown(): bool
    {
        return $this->value === self::MARKDOWN;
    }

    public function isHtml(): bool
    {
        return $this->value === self::HTML;
    }

    public function isPlaintext(): bool
    {
        return $this->value === self::PLAINTEXT;
    }

    public function supportsPreview(): bool
    {
        return in_array($this->value, self::FORMATS_WITH_PREVIEW, true);
    }

    public function requiresCompilation(): bool
    {
        return in_array($this->value, self::FORMATS_REQUIRING_COMPILATION, true);
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
