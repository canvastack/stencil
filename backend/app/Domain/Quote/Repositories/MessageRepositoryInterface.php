<?php

declare(strict_types=1);

namespace App\Domain\Quote\Repositories;

use App\Domain\Quote\Entities\Message;

/**
 * Message Repository Interface
 * 
 * Defines the contract for message persistence operations.
 * Follows repository pattern for data access abstraction.
 */
interface MessageRepositoryInterface
{
    /**
     * Find message by UUID
     * 
     * @param string $uuid Message UUID
     * @param int $tenantId Tenant ID for isolation
     * @return Message|null Message entity or null if not found
     */
    public function findByUuid(string $uuid, int $tenantId): ?Message;

    /**
     * Find message by ID
     * 
     * @param int $id Message ID
     * @param int $tenantId Tenant ID for isolation
     * @return Message|null Message entity or null if not found
     */
    public function findById(int $id, int $tenantId): ?Message;

    /**
     * Find messages by quote ID
     * 
     * @param int $quoteId Quote ID
     * @param int $tenantId Tenant ID for isolation
     * @param string $sortOrder Sort direction (asc|desc)
     * @return Message[] Array of message entities ordered by created_at
     */
    public function findByQuoteId(int $quoteId, int $tenantId, string $sortOrder = 'asc'): array;

    /**
     * Count unread messages for user
     * 
     * @param int $userId User ID
     * @param int $tenantId Tenant ID for isolation
     * @return int Count of unread messages
     */
    public function countUnreadForUser(int $userId, int $tenantId): int;

    /**
     * Count unread messages for quote
     * 
     * @param int $quoteId Quote ID
     * @param int $userId User ID (to exclude own messages)
     * @param int $tenantId Tenant ID for isolation
     * @return int Count of unread messages
     */
    public function countUnreadForQuote(int $quoteId, int $userId, int $tenantId): int;

    /**
     * Save message (create or update)
     * 
     * @param Message $message Message entity to save
     * @return Message Saved message entity with ID
     */
    public function save(Message $message): Message;

    /**
     * Mark message as read
     * 
     * @param Message $message Message entity to mark as read
     * @return bool True if marked successfully
     */
    public function markAsRead(Message $message): bool;

    /**
     * Mark all messages in quote as read for user
     * 
     * @param int $quoteId Quote ID
     * @param int $userId User ID
     * @param int $tenantId Tenant ID for isolation
     * @return int Number of messages marked as read
     */
    public function markAllAsReadForQuote(int $quoteId, int $userId, int $tenantId): int;

    /**
     * Delete message
     * 
     * @param Message $message Message entity to delete
     * @return bool True if deleted successfully
     */
    public function delete(Message $message): bool;

    /**
     * Find messages by sender
     * Requirements: 13.3, 13.4
     * 
     * @param int $senderId Sender user ID
     * @param string $senderType Sender type ('admin' or 'vendor')
     * @param int $tenantId Tenant ID for isolation
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array{data: Message[], total: int, page: int, per_page: int}
     */
    public function findBySender(
        int $senderId,
        string $senderType,
        int $tenantId,
        int $page = 1,
        int $perPage = 20
    ): array;

    /**
     * Count unread messages by sender type
     * Requirements: 13.9
     * 
     * @param int $quoteId Quote ID
     * @param string $senderType Sender type to count ('admin' or 'vendor')
     * @param int $tenantId Tenant ID for isolation
     * @return int Count of unread messages from specified sender type
     */
    public function countUnreadBySenderType(
        int $quoteId,
        string $senderType,
        int $tenantId
    ): int;

    /**
     * Get recent messages for vendor
     * Requirements: 13.1, 13.2
     * 
     * @param int $vendorId Vendor ID
     * @param int $tenantId Tenant ID for isolation
     * @param int $limit Number of messages to retrieve
     * @return Message[] Array of recent messages
     */
    public function getRecentForVendor(
        int $vendorId,
        int $tenantId,
        int $limit = 10
    ): array;
}
