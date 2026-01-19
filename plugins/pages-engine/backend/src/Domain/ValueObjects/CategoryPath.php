<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\ValueObjects;

use Plugins\PagesEngine\Domain\Exceptions\InvalidPathException;

final class CategoryPath
{
    private const MAX_DEPTH = 10;
    private const SEPARATOR = '/';
    private const PATTERN = '/^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/';

    private string $value;

    public function __construct(string $value)
    {
        $this->validate($value);
        $this->value = $value;
    }

    private function validate(string $value): void
    {
        if (empty($value)) {
            throw InvalidPathException::empty();
        }

        if (!str_starts_with($value, self::SEPARATOR)) {
            throw InvalidPathException::mustStartWithSlash($value);
        }

        if (!preg_match(self::PATTERN, $value)) {
            throw InvalidPathException::invalidFormat($value);
        }

        if ($this->getDepth($value) > self::MAX_DEPTH) {
            throw InvalidPathException::tooDeep(self::MAX_DEPTH);
        }
    }

    private function getDepth(string $path): int
    {
        if ($path === self::SEPARATOR) {
            return 0;
        }

        return count($this->getSegmentsFromPath($path));
    }

    private function getSegmentsFromPath(string $path): array
    {
        if ($path === self::SEPARATOR) {
            return [];
        }

        return array_filter(explode(self::SEPARATOR, $path));
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function getSegments(): array
    {
        return $this->getSegmentsFromPath($this->value);
    }

    public function getDepthLevel(): int
    {
        return $this->getDepth($this->value);
    }

    public function getParentPath(): ?self
    {
        if ($this->value === self::SEPARATOR) {
            return null;
        }

        $segments = $this->getSegments();
        array_pop($segments);

        if (empty($segments)) {
            return new self(self::SEPARATOR);
        }

        return new self(self::SEPARATOR . implode(self::SEPARATOR, $segments));
    }

    public function append(string $segment): self
    {
        $newPath = rtrim($this->value, self::SEPARATOR) . self::SEPARATOR . $segment;
        return new self($newPath);
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
