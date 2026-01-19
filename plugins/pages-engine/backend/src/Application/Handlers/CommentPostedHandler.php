<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Handlers;

use Plugins\PagesEngine\Domain\Events\CommentPosted;

final class CommentPostedHandler
{
    public function handle(CommentPosted $event): void
    {
    }
}
