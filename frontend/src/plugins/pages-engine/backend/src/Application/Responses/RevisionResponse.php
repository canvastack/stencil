<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Responses;

use Plugins\PagesEngine\Domain\Entities\ContentRevision;

final class RevisionResponse
{
    public function __construct(
        public readonly string $uuid,
        public readonly string $tenantId,
        public readonly string $contentId,
        public readonly int $revisionNumber,
        public readonly array $contentSnapshot,
        public readonly string $createdBy,
        public readonly ?string $changeNotes,
        public readonly string $createdAt
    ) {}

    public static function fromEntity(ContentRevision $revision): self
    {
        return new self(
            uuid: $revision->getId()->getValue(),
            tenantId: $revision->getTenantId()->getValue(),
            contentId: $revision->getContentId()->getValue(),
            revisionNumber: $revision->getRevisionNumber(),
            contentSnapshot: $revision->getContentSnapshot(),
            createdBy: $revision->getCreatedBy()->getValue(),
            changeNotes: $revision->getChangeNotes(),
            createdAt: $revision->getCreatedAt()->format('Y-m-d H:i:s')
        );
    }
}
