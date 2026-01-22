<?php

namespace App\Domain\Tenant\Repositories;

use App\Domain\Tenant\Entities\CustomDomain;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Tenant\Enums\CustomDomainStatus;
use App\Domain\Tenant\ValueObjects\DomainName;

interface CustomDomainRepositoryInterface
{
    public function findById(Uuid $id): ?CustomDomain;

    public function findByDomain(DomainName $domain): ?CustomDomain;

    public function findByTenantId(Uuid $tenantId): array;

    public function findVerifiedByTenantId(Uuid $tenantId): array;

    public function findActiveByTenantId(Uuid $tenantId): array;

    public function findByStatus(CustomDomainStatus $status): array;

    public function findPendingVerification(): array;

    public function findExpiringSsl(int $daysBeforeExpiry = 30): array;

    public function save(CustomDomain $domain): CustomDomain;

    public function delete(Uuid $id): bool;

    public function exists(DomainName $domain): bool;

    public function existsForTenant(Uuid $tenantId, DomainName $domain): bool;

    public function markAsVerified(Uuid $id): bool;

    public function markAsFailed(Uuid $id): bool;

    public function activate(Uuid $id): bool;

    public function suspend(Uuid $id): bool;

    public function updateStatus(Uuid $id, CustomDomainStatus $status): bool;

    public function countByTenantId(Uuid $tenantId): int;

    public function countByStatus(CustomDomainStatus $status): int;

    public function findAll(
        ?Uuid $tenantId = null,
        ?CustomDomainStatus $status = null,
        ?bool $isVerified = null,
        int $limit = 50,
        int $offset = 0
    ): array;
}
