<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Queries;

final class GetPlatformContentTypesQuery
{
    public function __construct(
        public readonly bool $includeInactive = false
    ) {}
}
