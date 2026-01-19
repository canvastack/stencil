<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Handlers;

use Plugins\PagesEngine\Domain\Events\ContentUrlChanged;

final class ContentUrlChangedHandler
{
    public function handle(ContentUrlChanged $event): void
    {
    }
}
