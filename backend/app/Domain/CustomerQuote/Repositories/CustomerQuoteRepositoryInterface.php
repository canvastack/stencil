<?php

declare(strict_types=1);

namespace App\Domain\CustomerQuote\Repositories;

use App\Domain\CustomerQuote\Entities\CustomerQuote;

/**
 * CustomerQuoteRepositoryInterface
 * 
 * Repository interface (port) for CustomerQuote persistence.
 * Implementation will be in Infrastructure layer.
 */
interface CustomerQuoteRepositoryInterface
{
    /**
     * Find quote by ID
     */
    public function findById(int $id): ?CustomerQuote;

    /**
     * Find quote by UUID
     */
    public function findByUuid(string $uuid): ?CustomerQuote;

    /**
     * Find quote by response token
     */
    public function findByToken(string $token): ?CustomerQuote;

    /**
     * Find quotes by order ID
     */
    public function findByOrderId(int $orderId): array;

    /**
     * Find quotes by vendor quote ID
     */
    public function findByVendorQuoteId(int $vendorQuoteId): array;

    /**
     * Find quotes by status
     */
    public function findByStatus(int $tenantId, string $status): array;

    /**
     * Find pending approval quotes
     */
    public function findPendingApprovals(int $tenantId): array;

    /**
     * Find expired quotes
     */
    public function findExpired(int $tenantId): array;

    /**
     * Find expiring soon quotes
     */
    public function findExpiringSoon(int $tenantId, int $hoursThreshold = 24): array;

    /**
     * Save quote (create or update)
     */
    public function save(CustomerQuote $quote): void;

    /**
     * Delete quote
     */
    public function delete(int $id): void;

    /**
     * Get next sequence number for quote numbering
     */
    public function getNextSequence(int $tenantId, string $type, int $year): int;

    /**
     * Count quotes by status
     */
    public function countByStatus(int $tenantId, string $status): int;

    /**
     * Get quotes with filters
     */
    public function findWithFilters(int $tenantId, array $filters = [], int $limit = 50, int $offset = 0): array;

    /**
     * Get total count with filters
     */
    public function countWithFilters(int $tenantId, array $filters = []): int;
}
