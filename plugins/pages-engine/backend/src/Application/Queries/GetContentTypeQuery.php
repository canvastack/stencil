<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Application\Queries;

use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

final class GetContentTypeQuery
{
    public function __construct(
        public readonly Uuid $contentTypeId,
        public readonly ?Uuid $tenantId
    ) {}
}
