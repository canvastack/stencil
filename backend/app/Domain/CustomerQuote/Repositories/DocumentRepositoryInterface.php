<?php

declare(strict_types=1);

namespace App\Domain\CustomerQuote\Repositories;

use App\Domain\CustomerQuote\Entities\OrderDocument;

/**
 * DocumentRepositoryInterface
 * 
 * Repository interface (port) for OrderDocument persistence.
 * Implementation will be in Infrastructure layer.
 */
interface DocumentRepositoryInterface
{
    /**
     * Find document by ID
     */
    public function findById(int $id): ?OrderDocument;

    /**
     * Find document by UUID
     */
    public function findByUuid(string $uuid): ?OrderDocument;

    /**
     * Find documents by order ID
     */
    public function findByOrderId(int $orderId): array;

    /**
     * Find document by order and type
     */
    public function findByOrderAndType(int $orderId, string $type): ?OrderDocument;

    /**
     * Find latest version of document
     */
    public function findLatestVersion(int $orderId, string $type): ?OrderDocument;

    /**
     * Find documents by customer quote ID
     */
    public function findByCustomerQuoteId(int $customerQuoteId): array;

    /**
     * Find documents by vendor quote ID
     */
    public function findByVendorQuoteId(int $vendorQuoteId): array;

    /**
     * Find documents by status
     */
    public function findByStatus(int $tenantId, string $status): array;

    /**
     * Find documents by type
     */
    public function findByType(int $tenantId, string $type): array;

    /**
     * Save document (create or update)
     */
    public function save(OrderDocument $document): void;

    /**
     * Delete document (soft delete)
     */
    public function delete(int $id): void;

    /**
     * Get next sequence number for document numbering
     */
    public function getNextSequence(int $tenantId, string $documentType, int $year): int;

    /**
     * Count documents by type
     */
    public function countByType(int $tenantId, string $type): int;

    /**
     * Get documents with filters
     */
    public function findWithFilters(int $tenantId, array $filters = [], int $limit = 50, int $offset = 0): array;
}
