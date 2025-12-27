<?php

namespace App\Domain\Review\Repositories;

use App\Domain\Review\Entities\Review;
use App\Domain\Shared\ValueObjects\UuidValueObject;

interface ReviewRepositoryInterface
{
    public function findById(UuidValueObject $id): ?Review;

    public function findByProductId(UuidValueObject $productId): array;

    public function findByProductUuid(string $productUuid): array;

    public function findByTenantAndProductUuid(UuidValueObject $tenantId, string $productUuid): array;

    public function findByCustomerId(UuidValueObject $customerId): array;

    public function findByOrderId(UuidValueObject $orderId): array;

    public function findByTenantId(UuidValueObject $tenantId): array;

    public function findApproved(UuidValueObject $tenantId): array;

    public function findPending(UuidValueObject $tenantId): array;

    public function findVerifiedPurchases(UuidValueObject $productId): array;

    public function save(Review $review): Review;

    public function delete(UuidValueObject $id): bool;

    public function countByProductId(UuidValueObject $productId): int;

    public function countByTenantId(UuidValueObject $tenantId): int;

    public function getAverageRating(UuidValueObject $productId): float;

    public function getRatingDistribution(UuidValueObject $productId): array;
}
