<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Handlers;

use Plugins\PagesEngine\Domain\Events\ContentUnpublished;

final class ContentUnpublishedHandler
{
    public function handle(ContentUnpublished $event): void
    {
    }
}
