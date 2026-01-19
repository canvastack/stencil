<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Entities;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use Plugins\PagesEngine\Domain\ValueObjects\EditorFormat;
use DateTime;
use InvalidArgumentException;

final class ContentRevision
{
    private Uuid $id;
    private Uuid $contentId;
    private string $title;
    private ?string $excerpt;
    private array $content;
    private EditorFormat $contentFormat;
    private Uuid $createdBy;
    private ?string $changeSummary;
    private array $metadata;
    private DateTime $createdAt;

    public function __construct(
        Uuid $id,
        Uuid $contentId,
        string $title,
        array $content,
        EditorFormat $contentFormat,
        Uuid $createdBy,
        ?string $excerpt = null,
        ?string $changeSummary = null,
        array $metadata = [],
        ?DateTime $createdAt = null
    ) {
        $this->validateTitle($title);
        $this->validateContent($content);

        $this->id = $id;
        $this->contentId = $contentId;
        $this->title = $title;
        $this->excerpt = $excerpt;
        $this->content = $content;
        $this->contentFormat = $contentFormat;
        $this->createdBy = $createdBy;
        $this->changeSummary = $changeSummary;
        $this->metadata = $metadata;
        $this->createdAt = $createdAt ?? new DateTime();
    }

    private function validateTitle(string $title): void
    {
        if (empty(trim($title))) {
            throw new InvalidArgumentException('Revision title cannot be empty');
        }

        if (strlen($title) > 500) {
            throw new InvalidArgumentException('Revision title cannot exceed 500 characters');
        }
    }

    private function validateContent(array $content): void
    {
        if (empty($content)) {
            throw new InvalidArgumentException('Revision content cannot be empty');
        }
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getContentId(): Uuid
    {
        return $this->contentId;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getExcerpt(): ?string
    {
        return $this->excerpt;
    }

    public function getContent(): array
    {
        return $this->content;
    }

    public function getContentFormat(): EditorFormat
    {
        return $this->contentFormat;
    }

    public function getCreatedBy(): Uuid
    {
        return $this->createdBy;
    }

    public function getChangeSummary(): ?string
    {
        return $this->changeSummary;
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }

    public function getCreatedAt(): DateTime
    {
        return $this->createdAt;
    }
}
