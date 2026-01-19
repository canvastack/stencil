<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Commands;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class ApproveCommentCommand
{
    public function __construct(
        public readonly Uuid $commentId,
        public readonly Uuid $tenantId,
        public readonly Uuid $approvedBy
    ) {}
}
