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
}
