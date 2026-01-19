<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Handlers;

use Plugins\PagesEngine\Domain\Events\CommentApproved;

final class CommentApprovedHandler
{
    public function handle(CommentApproved $event): void
    {
    }
}
