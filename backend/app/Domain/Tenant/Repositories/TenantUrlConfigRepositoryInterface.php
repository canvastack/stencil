<?php

namespace App\Domain\Tenant\Repositories;

use App\Domain\Tenant\Entities\TenantUrlConfiguration;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Tenant\Enums\UrlPattern;
use App\Domain\Tenant\ValueObjects\SubdomainName;
use App\Domain\Tenant\ValueObjects\UrlPath;

interface TenantUrlConfigRepositoryInterface
{
    public function findById(Uuid $id): ?TenantUrlConfiguration;

    public function findByTenantId(Uuid $tenantId): array;

    public function findPrimaryByTenantId(Uuid $tenantId): ?TenantUrlConfiguration;

    public function findEnabledByTenantId(Uuid $tenantId): array;

    public function findBySubdomain(SubdomainName $subdomain): ?TenantUrlConfiguration;

    public function findByUrlPath(UrlPath $urlPath): ?TenantUrlConfiguration;

    public function findByCustomDomainId(Uuid $customDomainId): ?TenantUrlConfiguration;

    public function findByPattern(UrlPattern $pattern): array;

    public function save(TenantUrlConfiguration $config): TenantUrlConfiguration;

    public function delete(Uuid $id): bool;

    public function exists(Uuid $tenantId, UrlPattern $pattern): bool;

    public function existsSubdomain(SubdomainName $subdomain): bool;

    public function existsUrlPath(UrlPath $urlPath): bool;

    public function setPrimary(Uuid $configId, Uuid $tenantId): bool;

    public function unsetAllPrimary(Uuid $tenantId): bool;

    public function countByTenantId(Uuid $tenantId): int;

    public function hasPrimaryConfig(Uuid $tenantId): bool;

    public function enable(Uuid $id): bool;

    public function disable(Uuid $id): bool;

    public function findAll(
        ?Uuid $tenantId = null,
        ?UrlPattern $pattern = null,
        ?bool $isEnabled = null,
        int $limit = 50,
        int $offset = 0
    ): array;
}
