<?php

declare(strict_types=1);

namespace App\Domain\Quote\Services;

use App\Domain\Quote\Entities\Message;
use App\Domain\Quote\Entities\Quote;
use App\Domain\Quote\Repositories\MessageRepositoryInterface;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Notification\Services\NotificationService;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

/**
 * Message Service
 * 
 * Domain service responsible for managing quote messages and communication
 * between admins and vendors. Handles message creation, file attachments,
 * and notification delivery.
 * 
 * Business Rules:
 * - Messages are tenant-scoped for data isolation
 * - File attachments must not exceed 10MB per file
 * - Sending a message triggers notifications to recipient
 * - Messages are ordered chronologically in threads
 * - Read tracking for message status
 * 
 * Requirements: 9.2, 9.3 (Communication Center)
 */
class MessageService
{
    private const ATTACHMENT_DISK = 'local';
    private const ATTACHMENT_PATH = 'quote-attachments';

    public function __construct(
        private MessageRepositoryInterface $messageRepository,
        private QuoteRepositoryInterface $quoteRepository,
        private NotificationService $notificationService,
        private \App\Domain\Notification\Repositories\NotificationRepositoryInterface $notificationRepository
    ) {}

    /**
     * Send a message in a quote thread
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param int $quoteId Quote ID
     * @param int $senderId User ID of sender
     * @param string $messageContent Message text content
     * @param array $uploadedFiles Array of UploadedFile instances
     * @return Message Created message entity
     * @throws \InvalidArgumentException If validation fails
     * @throws \Exception If message creation fails
     */
    public function sendMessage(
        int $tenantId,
        int $quoteId,
        int $senderId,
        string $messageContent,
        array $uploadedFiles = []
    ): Message {
        try {
            // Validate quote exists and belongs to tenant
            $quote = $this->quoteRepository->findById($quoteId, $tenantId);
            if (!$quote) {
                throw new \InvalidArgumentException('Quote not found');
            }

            // Process file attachments
            $attachments = $this->processAttachments($uploadedFiles, $tenantId, $quoteId);

            // Create message entity
            $message = Message::create(
                tenantId: $tenantId,
                quoteId: $quoteId,
                senderId: $senderId,
                message: $messageContent,
                attachments: $attachments
            );

            // Save message to database
            $savedMessage = $this->messageRepository->save($message);

            // Send notifications to recipient
            $this->sendMessageNotifications($savedMessage, $quote);

            Log::info('Message sent successfully', [
                'message_uuid' => $savedMessage->getUuid(),
                'quote_id' => $quoteId,
                'sender_id' => $senderId,
                'attachment_count' => count($attachments)
            ]);

            return $savedMessage;

        } catch (\Exception $e) {
            Log::error('Failed to send message', [
                'quote_id' => $quoteId,
                'sender_id' => $senderId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Get messages for a quote thread
     * 
     * @param int $quoteId Quote ID
     * @param int $tenantId Tenant ID for isolation
     * @return Message[] Array of messages ordered chronologically
     */
    public function getQuoteMessages(int $quoteId, int $tenantId): array
    {
        return $this->messageRepository->findByQuoteId($quoteId, $tenantId, 'asc');
    }

    /**
     * Mark message as read
     * 
     * @param string $messageUuid Message UUID
     * @param int $tenantId Tenant ID for isolation
     * @return bool True if marked successfully
     */
    public function markMessageAsRead(string $messageUuid, int $tenantId): bool
    {
        $message = $this->messageRepository->findByUuid($messageUuid, $tenantId);
        
        if (!$message) {
            return false;
        }

        if ($message->isRead()) {
            return true; // Already read
        }

        $message->markAsRead();
        return $this->messageRepository->markAsRead($message);
    }

    /**
     * Mark all messages in quote as read for user
     * 
     * @param int $quoteId Quote ID
     * @param int $userId User ID
     * @param int $tenantId Tenant ID for isolation
     * @return int Number of messages marked as read
     */
    public function markAllMessagesAsRead(int $quoteId, int $userId, int $tenantId): int
    {
        return $this->messageRepository->markAllAsReadForQuote($quoteId, $userId, $tenantId);
    }

    /**
     * Get unread message count for quote
     * 
     * @param int $quoteId Quote ID
     * @param int $userId User ID (to exclude own messages)
     * @param int $tenantId Tenant ID for isolation
     * @return int Count of unread messages
     */
    public function getUnreadCount(int $quoteId, int $userId, int $tenantId): int
    {
        return $this->messageRepository->countUnreadForQuote($quoteId, $userId, $tenantId);
    }

    /**
     * Process uploaded file attachments
     * 
     * @param array $uploadedFiles Array of UploadedFile instances
     * @param int $tenantId Tenant ID for path organization
     * @param int $quoteId Quote ID for path organization
     * @return array Array of attachment metadata
     * @throws \InvalidArgumentException If file validation fails
     */
    private function processAttachments(array $uploadedFiles, int $tenantId, int $quoteId): array
    {
        $attachments = [];

        foreach ($uploadedFiles as $file) {
            if (!$file instanceof UploadedFile) {
                throw new \InvalidArgumentException('Invalid file upload');
            }

            // Validate file
            if (!$file->isValid()) {
                throw new \InvalidArgumentException("File upload failed: {$file->getClientOriginalName()}");
            }

            // Store file
            $path = $file->store(
                self::ATTACHMENT_PATH . "/{$tenantId}/{$quoteId}",
                self::ATTACHMENT_DISK
            );

            if (!$path) {
                throw new \RuntimeException("Failed to store file: {$file->getClientOriginalName()}");
            }

            // Build attachment metadata
            $attachments[] = [
                'name' => $file->getClientOriginalName(),
                'path' => $path,
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType()
            ];
        }

        return $attachments;
    }

    /**
     * Send notifications to message recipient
     * 
     * @param Message $message Message entity
     * @param Quote $quote Quote entity
     * @return void
     */
    private function sendMessageNotifications(Message $message, Quote $quote): void
    {
        try {
            // Determine recipient based on sender
            $sender = User::find($message->getSenderId());
            if (!$sender) {
                Log::warning('Sender not found for message notification', [
                    'message_uuid' => $message->getUuid(),
                    'sender_id' => $message->getSenderId()
                ]);
                return;
            }

            // Check if sender is admin or vendor
            $isAdminSender = $sender->hasRole('Admin');

            if ($isAdminSender) {
                // Admin sent message, notify vendor
                $vendor = Vendor::find($quote->getVendorId());
                if ($vendor && $vendor->user_id) {
                    $this->notifyUser(
                        userId: $vendor->user_id,
                        tenantId: $quote->getTenantId(),
                        message: $message,
                        quote: $quote,
                        senderName: $sender->name
                    );
                }
            } else {
                // Vendor sent message, notify all admins
                $adminUsers = User::where('tenant_id', $quote->getTenantId())
                    ->whereHas('roles', fn($q) => $q->where('name', 'Admin'))
                    ->get();

                foreach ($adminUsers as $admin) {
                    $this->notifyUser(
                        userId: $admin->id,
                        tenantId: $quote->getTenantId(),
                        message: $message,
                        quote: $quote,
                        senderName: $sender->name
                    );
                }
            }

        } catch (\Exception $e) {
            Log::error('Failed to send message notifications', [
                'message_uuid' => $message->getUuid(),
                'error' => $e->getMessage()
            ]);
            // Don't throw - message was already saved successfully
        }
    }

    /**
     * Notify a specific user about a new message
     * 
     * @param int $userId User ID to notify
     * @param int $tenantId Tenant ID
     * @param Message $message Message entity
     * @param Quote $quote Quote entity
     * @param string $senderName Name of message sender
     * @return void
     */
    private function notifyUser(
        int $userId,
        int $tenantId,
        Message $message,
        Quote $quote,
        string $senderName
    ): void {
        // Create in-app notification
        $notification = \App\Domain\Notification\Entities\Notification::messageReceived(
            tenantId: $tenantId,
            userId: $userId,
            messageUuid: $message->getUuid(),
            quoteUuid: $quote->getUuid(),
            quoteNumber: $quote->getQuoteNumber(),
            senderName: $senderName,
            messagePreview: substr($message->getMessage(), 0, 100)
        );

        $this->notificationRepository->save($notification);

        // Email notification would be sent here
        // For now, we'll rely on in-app notifications
        // Email implementation can be added later with proper templates
    }

    /**
     * Delete attachment file from storage
     * 
     * @param string $path File path in storage
     * @return bool True if deleted successfully
     */
    public function deleteAttachment(string $path): bool
    {
        try {
            return Storage::disk(self::ATTACHMENT_DISK)->delete($path);
        } catch (\Exception $e) {
            Log::error('Failed to delete attachment', [
                'path' => $path,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get attachment download URL
     * 
     * @param string $path File path in storage
     * @return string|null Download URL or null if file doesn't exist
     */
    public function getAttachmentUrl(string $path): ?string
    {
        try {
            if (!Storage::disk(self::ATTACHMENT_DISK)->exists($path)) {
                return null;
            }

            return Storage::disk(self::ATTACHMENT_DISK)->url($path);
        } catch (\Exception $e) {
            Log::error('Failed to get attachment URL', [
                'path' => $path,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}
