<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Commands;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class SubmitCommentCommand
{
    public function __construct(
        public readonly Uuid $tenantId,
        public readonly Uuid $contentId,
        public readonly ?Uuid $parentId,
        public readonly ?Uuid $authorId,
        public readonly string $authorName,
        public readonly string $authorEmail,
        public readonly string $commentText,
        public readonly string $userIp,
        public readonly string $userAgent
    ) {}
}
