<?php

namespace App\Domain\Tenant\Repositories;

use App\Domain\Tenant\Entities\DomainMapping;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Tenant\ValueObjects\DomainName;
use App\Domain\Tenant\Enums\DomainStatus;

interface DomainMappingRepositoryInterface
{
    public function findById(UuidValueObject $id): ?DomainMapping;

    public function findByDomain(DomainName $domain): ?DomainMapping;

    public function findByTenantId(UuidValueObject $tenantId): array;

    public function findPrimaryByTenantId(UuidValueObject $tenantId): ?DomainMapping;

    public function findActiveByTenantId(UuidValueObject $tenantId): array;

    public function findByStatus(DomainStatus $status): array;

    public function findByDomainAndSubdomain(DomainName $domain, ?string $subdomain = null): ?DomainMapping;

    public function save(DomainMapping $domainMapping): DomainMapping;

    public function delete(UuidValueObject $id): bool;

    public function exists(DomainName $domain, ?string $subdomain = null): bool;

    public function existsForTenant(UuidValueObject $tenantId, DomainName $domain): bool;

    public function setPrimary(UuidValueObject $domainMappingId, UuidValueObject $tenantId): bool;

    public function unsetAllPrimary(UuidValueObject $tenantId): bool;

    public function countByTenantId(UuidValueObject $tenantId): int;

    public function findPendingVerification(): array;

    public function markAsVerified(UuidValueObject $id): bool;

    public function markAsFailed(UuidValueObject $id, ?string $reason = null): bool;

    public function findExpiringSsl(int $daysBeforeExpiry = 30): array;

    public function updateStatus(UuidValueObject $id, DomainStatus $status): bool;

    public function findByTenantAndStatus(UuidValueObject $tenantId, DomainStatus $status): array;

    public function hasPrimaryDomain(UuidValueObject $tenantId): bool;
}