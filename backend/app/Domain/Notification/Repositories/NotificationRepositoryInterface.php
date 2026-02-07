<?php

declare(strict_types=1);

namespace App\Domain\Notification\Repositories;

use App\Domain\Notification\Entities\Notification;

/**
 * Notification Repository Interface
 * 
 * Defines the contract for notification persistence operations.
 * Implementations handle database interactions while maintaining domain isolation.
 */
interface NotificationRepositoryInterface
{
    /**
     * Save notification to persistence
     * 
     * @param Notification $notification
     * @return Notification Persisted notification with ID set
     */
    public function save(Notification $notification): Notification;

    /**
     * Find notification by UUID
     * 
     * @param string $uuid
     * @return Notification|null
     */
    public function findByUuid(string $uuid): ?Notification;

    /**
     * Find notification by ID
     * 
     * @param int $id
     * @return Notification|null
     */
    public function findById(int $id): ?Notification;

    /**
     * Get unread notifications for user
     * 
     * @param int $userId
     * @param int $tenantId
     * @param int $limit
     * @return array<Notification>
     */
    public function getUnreadForUser(int $userId, int $tenantId, int $limit = 50): array;

    /**
     * Get all notifications for user
     * 
     * @param int $userId
     * @param int $tenantId
     * @param int $page
     * @param int $perPage
     * @return array{data: array<Notification>, total: int}
     */
    public function getAllForUser(int $userId, int $tenantId, int $page = 1, int $perPage = 20): array;

    /**
     * Get unread count for user
     * 
     * @param int $userId
     * @param int $tenantId
     * @return int
     */
    public function getUnreadCount(int $userId, int $tenantId): int;

    /**
     * Mark notification as read
     * 
     * @param string $uuid
     * @param int $userId
     * @param int $tenantId
     * @return bool
     */
    public function markAsRead(string $uuid, int $userId, int $tenantId): bool;

    /**
     * Mark all notifications as read for user
     * 
     * @param int $userId
     * @param int $tenantId
     * @return int Number of notifications marked as read
     */
    public function markAllAsRead(int $userId, int $tenantId): int;

    /**
     * Delete notification
     * 
     * @param string $uuid
     * @param int $tenantId
     * @return bool
     */
    public function delete(string $uuid, int $tenantId): bool;

    /**
     * Get notifications by type
     * 
     * @param string $type
     * @param int $tenantId
     * @param int $page
     * @param int $perPage
     * @return array{data: array<Notification>, total: int}
     */
    public function getByType(string $type, int $tenantId, int $page = 1, int $perPage = 20): array;
}
