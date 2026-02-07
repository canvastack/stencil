<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Quote\Entities\Message;
use App\Domain\Quote\Repositories\MessageRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\QuoteMessage;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Message Repository Implementation
 * 
 * Implements message data persistence using Eloquent ORM.
 * Part of the Infrastructure layer - framework specific.
 * 
 * Database Integration:
 * - Maps to quote_messages table
 * - Handles UUID-based operations
 * - Maintains tenant isolation
 * - Converts between domain entities and Eloquent models
 * 
 * Business Rules:
 * - All operations are tenant-scoped
 * - Messages ordered chronologically by default
 * - Read tracking with timestamps
 * - Soft deletes for audit trail
 */
class MessageRepository implements MessageRepositoryInterface
{
    /**
     * Find message by UUID
     * 
     * @param string $uuid Message UUID
     * @param int $tenantId Tenant ID for isolation
     * @return Message|null Message entity or null if not found
     */
    public function findByUuid(string $uuid, int $tenantId): ?Message
    {
        $model = QuoteMessage::where('uuid', $uuid)
            ->where('tenant_id', $tenantId)
            ->first();
        
        return $model ? $this->toDomainEntity($model) : null;
    }

    /**
     * Find message by ID
     * 
     * @param int $id Message ID
     * @param int $tenantId Tenant ID for isolation
     * @return Message|null Message entity or null if not found
     */
    public function findById(int $id, int $tenantId): ?Message
    {
        $model = QuoteMessage::where('id', $id)
            ->where('tenant_id', $tenantId)
            ->first();
        
        return $model ? $this->toDomainEntity($model) : null;
    }

    /**
     * Find messages by quote ID
     * 
     * @param int $quoteId Quote ID
     * @param int $tenantId Tenant ID for isolation
     * @param string $sortOrder Sort direction (asc|desc)
     * @return Message[] Array of message entities ordered by created_at
     */
    public function findByQuoteId(int $quoteId, int $tenantId, string $sortOrder = 'asc'): array
    {
        $models = QuoteMessage::where('quote_id', $quoteId)
            ->where('tenant_id', $tenantId)
            ->orderBy('created_at', $sortOrder)
            ->get();
        
        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Count unread messages for user
     * 
     * @param int $userId User ID
     * @param int $tenantId Tenant ID for isolation
     * @return int Count of unread messages
     */
    public function countUnreadForUser(int $userId, int $tenantId): int
    {
        return QuoteMessage::where('tenant_id', $tenantId)
            ->whereNull('read_at')
            ->whereHas('quote', function ($query) use ($userId) {
                // Count messages where user is not the sender
                $query->where(function ($q) use ($userId) {
                    $q->whereHas('vendor', function ($vq) use ($userId) {
                        $vq->where('user_id', $userId);
                    })->orWhereHas('order', function ($oq) use ($userId) {
                        $oq->where('user_id', $userId);
                    });
                });
            })
            ->where('sender_id', '!=', $userId)
            ->count();
    }

    /**
     * Count unread messages for quote
     * 
     * @param int $quoteId Quote ID
     * @param int $userId User ID (to exclude own messages)
     * @param int $tenantId Tenant ID for isolation
     * @return int Count of unread messages
     */
    public function countUnreadForQuote(int $quoteId, int $userId, int $tenantId): int
    {
        return QuoteMessage::where('quote_id', $quoteId)
            ->where('tenant_id', $tenantId)
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->count();
    }

    /**
     * Save message (create or update)
     * 
     * @param Message $message Message entity to save
     * @return Message Saved message entity with ID
     */
    public function save(Message $message): Message
    {
        try {
            DB::beginTransaction();

            $data = [
                'uuid' => $message->getUuid(),
                'tenant_id' => $message->getTenantId(),
                'quote_id' => $message->getQuoteId(),
                'sender_id' => $message->getSenderId(),
                'message' => $message->getMessage(),
                'attachments' => $message->getAttachments(),
                'read_at' => $message->getReadAt()?->format('Y-m-d H:i:s'),
                'created_at' => $message->getCreatedAt()->format('Y-m-d H:i:s'),
                'updated_at' => $message->getUpdatedAt()->format('Y-m-d H:i:s'),
            ];

            if ($message->getId() !== null) {
                // Update existing message
                $model = QuoteMessage::where('id', $message->getId())
                    ->where('tenant_id', $message->getTenantId())
                    ->firstOrFail();
                
                $model->update($data);
            } else {
                // Create new message
                $model = QuoteMessage::create($data);
                
                // Set ID on domain entity
                $message->setId($model->id);
            }

            DB::commit();

            Log::info('Message saved successfully', [
                'message_id' => $model->id,
                'message_uuid' => $model->uuid,
                'quote_id' => $model->quote_id,
                'tenant_id' => $model->tenant_id
            ]);

            return $this->toDomainEntity($model->fresh());

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to save message', [
                'message_uuid' => $message->getUuid(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw $e;
        }
    }

    /**
     * Mark message as read
     * 
     * @param Message $message Message entity to mark as read
     * @return bool True if marked successfully
     */
    public function markAsRead(Message $message): bool
    {
        try {
            $model = QuoteMessage::where('id', $message->getId())
                ->where('tenant_id', $message->getTenantId())
                ->firstOrFail();
            
            $model->read_at = $message->getReadAt()?->format('Y-m-d H:i:s');
            $model->updated_at = $message->getUpdatedAt()->format('Y-m-d H:i:s');
            
            return $model->save();

        } catch (\Exception $e) {
            Log::error('Failed to mark message as read', [
                'message_id' => $message->getId(),
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }

    /**
     * Mark all messages in quote as read for user
     * 
     * @param int $quoteId Quote ID
     * @param int $userId User ID
     * @param int $tenantId Tenant ID for isolation
     * @return int Number of messages marked as read
     */
    public function markAllAsReadForQuote(int $quoteId, int $userId, int $tenantId): int
    {
        try {
            $updated = QuoteMessage::where('quote_id', $quoteId)
                ->where('tenant_id', $tenantId)
                ->where('sender_id', '!=', $userId)
                ->whereNull('read_at')
                ->update([
                    'read_at' => now(),
                    'updated_at' => now()
                ]);

            Log::info('Marked messages as read', [
                'quote_id' => $quoteId,
                'user_id' => $userId,
                'count' => $updated
            ]);

            return $updated;

        } catch (\Exception $e) {
            Log::error('Failed to mark all messages as read', [
                'quote_id' => $quoteId,
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            
            return 0;
        }
    }

    /**
     * Delete message
     * 
     * @param Message $message Message entity to delete
     * @return bool True if deleted successfully
     */
    public function delete(Message $message): bool
    {
        try {
            $model = QuoteMessage::where('id', $message->getId())
                ->where('tenant_id', $message->getTenantId())
                ->firstOrFail();
            
            return $model->delete();

        } catch (\Exception $e) {
            Log::error('Failed to delete message', [
                'message_id' => $message->getId(),
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }

    /**
     * Convert Eloquent model to domain entity
     * 
     * @param QuoteMessage $model Eloquent model
     * @return Message Domain entity
     */
    private function toDomainEntity(QuoteMessage $model): Message
    {
        return Message::reconstitute(
            id: $model->id,
            uuid: $model->uuid,
            tenantId: $model->tenant_id,
            quoteId: $model->quote_id,
            senderId: $model->sender_id,
            message: $model->message,
            attachments: $model->attachments ?? [],
            readAt: $model->read_at ? new DateTimeImmutable($model->read_at->format('Y-m-d H:i:s')) : null,
            createdAt: new DateTimeImmutable($model->created_at->format('Y-m-d H:i:s')),
            updatedAt: new DateTimeImmutable($model->updated_at->format('Y-m-d H:i:s'))
        );
    }
}
