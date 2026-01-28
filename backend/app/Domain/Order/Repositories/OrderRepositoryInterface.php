<?php

namespace App\Domain\Order\Repositories;

use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Shared\ValueObjects\UuidValueObject;

/**
 * Order Repository Interface (Port)
 * 
 * Defines the contract for order data persistence.
 * Part of the Domain layer - framework agnostic.
 * 
 * Database Integration:
 * - Abstracts access to orders table
 * - Handles UUID-based lookups
 * - Maintains tenant isolation
 */
interface OrderRepositoryInterface
{
    /**
     * Save order (create or update)
     */
    public function save(PurchaseOrder $order): PurchaseOrder;

    /**
     * Find order by UUID
     */
    public function findById(UuidValueObject $id): ?PurchaseOrder;

    /**
     * Find order by order number within tenant
     */
    public function findByOrderNumber(UuidValueObject $tenantId, string $orderNumber): ?PurchaseOrder;

    /**
     * Find orders by status within tenant
     */
    public function findByStatus(UuidValueObject $tenantId, OrderStatus $status): array;

    /**
     * Find orders by customer within tenant
     */
    public function findByCustomer(UuidValueObject $tenantId, UuidValueObject $customerId): array;

    /**
     * Find orders by vendor within tenant
     */
    public function findByVendor(UuidValueObject $tenantId, UuidValueObject $vendorId): array;

    /**
     * Check if order number exists within tenant
     */
    public function existsByOrderNumber(UuidValueObject $tenantId, string $orderNumber): bool;

    /**
     * Get paginated orders with filters
     */
    public function findWithFilters(
        UuidValueObject $tenantId,
        array $filters = [],
        int $page = 1,
        int $perPage = 15,
        string $sortBy = 'created_at',
        string $sortDirection = 'desc'
    ): array;

    /**
     * Count orders with filters
     */
    public function countWithFilters(UuidValueObject $tenantId, array $filters = []): int;

    /**
     * Delete order (soft delete)
     */
    public function delete(UuidValueObject $id): bool;

    /**
     * Get order statistics for tenant
     */
    public function getStatistics(UuidValueObject $tenantId): array;

    /**
     * Find orders requiring attention (overdue, pending actions)
     */
    public function findRequiringAttention(UuidValueObject $tenantId): array;

    /**
     * Get orders by date range
     */
    public function findByDateRange(
        UuidValueObject $tenantId,
        \DateTimeInterface $from,
        \DateTimeInterface $to
    ): array;

    /**
     * Search orders by term (order number, customer name, etc.)
     */
    public function search(UuidValueObject $tenantId, string $searchTerm): array;

    /**
     * Get recent orders for tenant
     */
    public function getRecent(UuidValueObject $tenantId, int $limit = 10): array;

    /**
     * Get orders by payment status
     */
    public function findByPaymentStatus(UuidValueObject $tenantId, string $paymentStatus): array;

    /**
     * Find orders with pending vendor negotiations
     */
    public function findWithPendingNegotiations(UuidValueObject $tenantId): array;

    /**
     * Find overdue orders
     */
    public function findOverdue(UuidValueObject $tenantId): array;

    /**
     * Get order totals by status for dashboard
     */
    public function getStatusTotals(UuidValueObject $tenantId): array;

    /**
     * Get revenue statistics for period
     */
    public function getRevenueStatistics(
        UuidValueObject $tenantId,
        \DateTimeInterface $from,
        \DateTimeInterface $to
    ): array;
}