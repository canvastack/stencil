<?php

namespace App\Domain\Tenant\Repositories;

use App\Domain\Tenant\Entities\Tenant;
use App\Domain\Tenant\ValueObjects\TenantSlug;
use App\Domain\Shared\ValueObjects\Uuid;

interface TenantRepositoryInterface
{
    public function save(Tenant $tenant): void;

    public function findById(Uuid $id): ?Tenant;

    public function findBySlug(TenantSlug $slug): ?Tenant;

    public function findByDomain(string $domain): ?Tenant;

    public function exists(TenantSlug $slug): bool;

    public function existsByDomain(string $domain): bool;

    public function delete(Uuid $id): void;

    /**
     * @return Tenant[]
     */
    public function findActive(): array;

    /**
     * @return Tenant[]
     */
    public function findExpiring(int $days = 7): array;

    public function countByStatus(string $status): int;

    public function findAll(
        ?string $status = null,
        ?string $subscriptionStatus = null,
        int $limit = 50,
        int $offset = 0
    ): array;
}