<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Services;

use Plugins\PagesEngine\Domain\Entities\Content;
use Plugins\PagesEngine\Domain\Entities\ContentRevision;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;
use DateTime;

final class RevisionManager
{
    private const DEFAULT_MAX_REVISIONS = 50;

    public function shouldCreateRevision(Content $content, array $changes): bool
    {
        if (isset($changes['content']) || isset($changes['title']) || isset($changes['excerpt'])) {
            return true;
        }

        return false;
    }

    public function createRevision(
        Content $content,
        Uuid $createdBy,
        ?string $changeSummary = null
    ): ContentRevision {
        return new ContentRevision(
            id: new Uuid($this->generateUuid()),
            contentId: $content->getId(),
            title: $content->getTitle(),
            content: $content->getContent(),
            contentFormat: $content->getContentFormat(),
            createdBy: $createdBy,
            excerpt: $content->getExcerpt(),
            changeSummary: $changeSummary
        );
    }

    public function pruneOldRevisions(
        array $revisions,
        int $maxRevisions = self::DEFAULT_MAX_REVISIONS
    ): array {
        if (count($revisions) <= $maxRevisions) {
            return [];
        }

        usort($revisions, function (ContentRevision $a, ContentRevision $b) {
            return $b->getCreatedAt() <=> $a->getCreatedAt();
        });

        return array_slice($revisions, $maxRevisions);
    }

    public function compareRevisions(ContentRevision $oldRevision, ContentRevision $newRevision): array
    {
        $changes = [];

        if ($oldRevision->getTitle() !== $newRevision->getTitle()) {
            $changes['title'] = [
                'old' => $oldRevision->getTitle(),
                'new' => $newRevision->getTitle()
            ];
        }

        if ($oldRevision->getExcerpt() !== $newRevision->getExcerpt()) {
            $changes['excerpt'] = [
                'old' => $oldRevision->getExcerpt(),
                'new' => $newRevision->getExcerpt()
            ];
        }

        if ($oldRevision->getContent() !== $newRevision->getContent()) {
            $changes['content'] = [
                'old' => $oldRevision->getContent(),
                'new' => $newRevision->getContent()
            ];
        }

        return $changes;
    }

    public function getRevisionSize(ContentRevision $revision): int
    {
        $size = strlen($revision->getTitle());
        $size += strlen($revision->getExcerpt() ?? '');
        $size += strlen(json_encode($revision->getContent()));

        return $size;
    }

    private function generateUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }
}
