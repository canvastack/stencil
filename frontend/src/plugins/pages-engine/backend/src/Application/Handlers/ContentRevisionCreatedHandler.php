<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Handlers;

use Plugins\PagesEngine\Domain\Events\ContentRevisionCreated;

final class ContentRevisionCreatedHandler
{
    public function handle(ContentRevisionCreated $event): void
    {
    }
}
