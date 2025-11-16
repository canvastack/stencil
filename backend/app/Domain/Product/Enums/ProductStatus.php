<?php

namespace App\Domain\Product\Enums;

enum ProductStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
    case ARCHIVED = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::PUBLISHED => 'Published',
            self::ARCHIVED => 'Archived',
        };
    }

    public function canBePurchased(): bool
    {
        return $this === self::PUBLISHED;
    }

    public static function fromString(string $status): self
    {
        return match (strtolower($status)) {
            'draft' => self::DRAFT,
            'published' => self::PUBLISHED,
            'archived' => self::ARCHIVED,
            default => throw new \InvalidArgumentException("Invalid product status: {$status}"),
        };
    }
}