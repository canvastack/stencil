<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Handlers;

use Plugins\PagesEngine\Domain\Events\ContentPublished;

final class ContentPublishedHandler
{
    public function handle(ContentPublished $event): void
    {
    }
}
