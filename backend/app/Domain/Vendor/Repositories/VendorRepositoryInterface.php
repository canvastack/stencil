<?php

namespace App\Domain\Vendor\Repositories;

use App\Domain\Vendor\Entities\Vendor;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Vendor\ValueObjects\VendorEmail;
use App\Domain\Vendor\Enums\VendorStatus;

interface VendorRepositoryInterface
{
    public function findById(UuidValueObject $id): ?Vendor;

    public function findByEmail(UuidValueObject $tenantId, VendorEmail $email): ?Vendor;

    public function findByTenantId(UuidValueObject $tenantId): array;

    public function findByStatus(UuidValueObject $tenantId, VendorStatus $status): array;

    public function findActiveVendors(UuidValueObject $tenantId): array;

    public function save(Vendor $vendor): Vendor;

    public function delete(UuidValueObject $id): bool;

    public function existsByEmail(UuidValueObject $tenantId, VendorEmail $email): bool;

    public function countByTenantId(UuidValueObject $tenantId): int;

    public function countByStatus(UuidValueObject $tenantId, VendorStatus $status): int;

    public function searchByName(UuidValueObject $tenantId, string $searchTerm): array;
}