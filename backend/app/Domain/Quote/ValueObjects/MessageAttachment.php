<?php

declare(strict_types=1);

namespace App\Domain\Quote\ValueObjects;

use InvalidArgumentException;

/**
 * MessageAttachment Value Object
 * 
 * Represents a file attachment in a quote message.
 * Requirements: 13.7, 13.8
 */
final class MessageAttachment
{
    private const MAX_FILE_SIZE = 10485760; // 10MB in bytes
    private const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    private string $filename;
    private string $url;
    private int $size;
    private string $mimeType;

    public function __construct(
        string $filename,
        string $url,
        int $size,
        string $mimeType
    ) {
        $this->validateFilename($filename);
        $this->validateUrl($url);
        $this->validateSize($size);
        $this->validateMimeType($mimeType);

        $this->filename = $filename;
        $this->url = $url;
        $this->size = $size;
        $this->mimeType = $mimeType;
    }

    private function validateFilename(string $filename): void
    {
        if (empty($filename)) {
            throw new InvalidArgumentException('Filename cannot be empty');
        }

        if (strlen($filename) > 255) {
            throw new InvalidArgumentException('Filename cannot exceed 255 characters');
        }
    }

    private function validateUrl(string $url): void
    {
        if (empty($url)) {
            throw new InvalidArgumentException('URL cannot be empty');
        }
    }

    private function validateSize(int $size): void
    {
        if ($size <= 0) {
            throw new InvalidArgumentException('File size must be positive');
        }

        if ($size > self::MAX_FILE_SIZE) {
            throw new InvalidArgumentException(
                sprintf('File size cannot exceed %d bytes (10MB)', self::MAX_FILE_SIZE)
            );
        }
    }

    private function validateMimeType(string $mimeType): void
    {
        if (!in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            throw new InvalidArgumentException(
                sprintf('Invalid MIME type: %s. Allowed types are: %s', 
                    $mimeType, 
                    implode(', ', self::ALLOWED_MIME_TYPES)
                )
            );
        }
    }

    public function filename(): string
    {
        return $this->filename;
    }

    public function url(): string
    {
        return $this->url;
    }

    public function size(): int
    {
        return $this->size;
    }

    public function mimeType(): string
    {
        return $this->mimeType;
    }

    public function sizeInMB(): float
    {
        return round($this->size / 1048576, 2);
    }

    public function isPdf(): bool
    {
        return $this->mimeType === 'application/pdf';
    }

    public function isImage(): bool
    {
        return in_array($this->mimeType, ['image/jpeg', 'image/png'], true);
    }

    public function isDocument(): bool
    {
        return in_array($this->mimeType, [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ], true);
    }

    public function isSpreadsheet(): bool
    {
        return in_array($this->mimeType, [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ], true);
    }

    public function toArray(): array
    {
        return [
            'filename' => $this->filename,
            'url' => $this->url,
            'size' => $this->size,
            'mime_type' => $this->mimeType,
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            $data['filename'] ?? '',
            $data['url'] ?? '',
            $data['size'] ?? 0,
            $data['mime_type'] ?? ''
        );
    }

    public function equals(self $other): bool
    {
        return $this->filename === $other->filename
            && $this->url === $other->url
            && $this->size === $other->size
            && $this->mimeType === $other->mimeType;
    }
}
