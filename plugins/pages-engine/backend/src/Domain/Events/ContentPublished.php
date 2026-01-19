<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Events;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use DateTime;

final class ContentPublished
{
    private Uuid $contentId;
    private Uuid $tenantId;
    private Uuid $contentTypeId;
    private Uuid $authorId;
    private string $title;
    private DateTime $publishedAt;
    private DateTime $occurredAt;

    public function __construct(
        Uuid $contentId,
        Uuid $tenantId,
        Uuid $contentTypeId,
        Uuid $authorId,
        string $title,
        DateTime $publishedAt
    ) {
        $this->contentId = $contentId;
        $this->tenantId = $tenantId;
        $this->contentTypeId = $contentTypeId;
        $this->authorId = $authorId;
        $this->title = $title;
        $this->publishedAt = $publishedAt;
        $this->occurredAt = new DateTime();
    }

    public function getContentId(): Uuid { return $this->contentId; }
    public function getTenantId(): Uuid { return $this->tenantId; }
    public function getContentTypeId(): Uuid { return $this->contentTypeId; }
    public function getAuthorId(): Uuid { return $this->authorId; }
    public function getTitle(): string { return $this->title; }
    public function getPublishedAt(): DateTime { return $this->publishedAt; }
    public function getOccurredAt(): DateTime { return $this->occurredAt; }
}
