<?php

declare(strict_types=1);

namespace App\Domain\Quote\Entities;

use App\Domain\Quote\Events\MessageSent;
use App\Domain\Quote\Events\MessageRead;
use App\Domain\Quote\Exceptions\InvalidAttachmentException;
use DateTimeImmutable;
use InvalidArgumentException;

/**
 * Message Domain Entity
 * 
 * Represents a message in a quote communication thread between admins and vendors.
 * Encapsulates message business rules and attachment validation.
 * 
 * Database Integration:
 * - Maps to quote_messages table
 * - Uses UUID for public identification
 * - Stores attachments as JSONB array
 * - Tracks read status with timestamp
 * 
 * Business Rules:
 * - Message content is required and cannot be empty
 * - File attachments must not exceed 10MB per file
 * - Attachments stored as array of objects with metadata
 * - Read tracking with timestamp
 * - Tenant-scoped for data isolation
 */
class Message
{
    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private string $uuid,
        private int $tenantId,
        private int $quoteId,
        private int $senderId,
        private string $message,
        private array $attachments,
        private ?DateTimeImmutable $readAt,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt
    ) {}

    /**
     * Create new message
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param int $quoteId Quote ID this message belongs to
     * @param int $senderId User ID of the sender
     * @param string $message Message content
     * @param array $attachments Array of attachment objects
     * @return self
     * @throws InvalidArgumentException If message is empty
     * @throws InvalidAttachmentException If attachment validation fails
     */
    public static function create(
        int $tenantId,
        int $quoteId,
        int $senderId,
        string $message,
        array $attachments = []
    ): self {
        // Validate message content
        $message = trim($message);
        if (empty($message)) {
            throw new InvalidArgumentException('Message content cannot be empty');
        }

        // Validate attachments
        self::validateAttachments($attachments);

        $now = new DateTimeImmutable();
        $uuid = \Illuminate\Support\Str::uuid()->toString();

        $messageEntity = new self(
            id: null,
            uuid: $uuid,
            tenantId: $tenantId,
            quoteId: $quoteId,
            senderId: $senderId,
            message: $message,
            attachments: $attachments,
            readAt: null,
            createdAt: $now,
            updatedAt: $now
        );

        $messageEntity->addDomainEvent(new MessageSent($messageEntity));

        return $messageEntity;
    }

    /**
     * Reconstitute message from persistence data
     */
    public static function reconstitute(
        int $id,
        string $uuid,
        int $tenantId,
        int $quoteId,
        int $senderId,
        string $message,
        array $attachments,
        ?DateTimeImmutable $readAt,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt
    ): self {
        return new self(
            id: $id,
            uuid: $uuid,
            tenantId: $tenantId,
            quoteId: $quoteId,
            senderId: $senderId,
            message: $message,
            attachments: $attachments,
            readAt: $readAt,
            createdAt: $createdAt,
            updatedAt: $updatedAt
        );
    }

    /**
     * Mark message as read
     * 
     * @return void
     */
    public function markAsRead(): void
    {
        if ($this->readAt !== null) {
            // Already read, no-op
            return;
        }

        $this->readAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();

        $this->addDomainEvent(new MessageRead($this));
    }

    /**
     * Check if message is read
     * 
     * @return bool
     */
    public function isRead(): bool
    {
        return $this->readAt !== null;
    }

    /**
     * Check if message has attachments
     * 
     * @return bool
     */
    public function hasAttachments(): bool
    {
        return !empty($this->attachments);
    }

    /**
     * Get attachment count
     * 
     * @return int
     */
    public function getAttachmentCount(): int
    {
        return count($this->attachments);
    }

    /**
     * Validate attachments array
     * 
     * Each attachment must have:
     * - name: string (filename)
     * - path: string (storage path)
     * - size: int (file size in bytes)
     * - mime_type: string (MIME type)
     * 
     * @param array $attachments Array of attachment objects
     * @throws InvalidAttachmentException If validation fails
     */
    private static function validateAttachments(array $attachments): void
    {
        foreach ($attachments as $index => $attachment) {
            // Check required fields
            if (!is_array($attachment)) {
                throw new InvalidAttachmentException(
                    "Attachment at index {$index} must be an array"
                );
            }

            $requiredFields = ['name', 'path', 'size', 'mime_type'];
            foreach ($requiredFields as $field) {
                if (!isset($attachment[$field])) {
                    throw new InvalidAttachmentException(
                        "Attachment at index {$index} is missing required field: {$field}"
                    );
                }
            }

            // Validate file size (10MB max)
            if (!is_int($attachment['size']) || $attachment['size'] <= 0) {
                throw new InvalidAttachmentException(
                    "Attachment at index {$index} has invalid size"
                );
            }

            if ($attachment['size'] > self::MAX_FILE_SIZE) {
                $maxSizeMB = self::MAX_FILE_SIZE / (1024 * 1024);
                throw new InvalidAttachmentException(
                    "Attachment '{$attachment['name']}' exceeds maximum file size of {$maxSizeMB}MB"
                );
            }

            // Validate name and path are non-empty strings
            if (!is_string($attachment['name']) || empty(trim($attachment['name']))) {
                throw new InvalidAttachmentException(
                    "Attachment at index {$index} has invalid name"
                );
            }

            if (!is_string($attachment['path']) || empty(trim($attachment['path']))) {
                throw new InvalidAttachmentException(
                    "Attachment at index {$index} has invalid path"
                );
            }

            // Validate MIME type is a non-empty string
            if (!is_string($attachment['mime_type']) || empty(trim($attachment['mime_type']))) {
                throw new InvalidAttachmentException(
                    "Attachment at index {$index} has invalid MIME type"
                );
            }
        }
    }

    // Getters
    public function getId(): ?int { return $this->id; }
    public function getUuid(): string { return $this->uuid; }
    public function getTenantId(): int { return $this->tenantId; }
    public function getQuoteId(): int { return $this->quoteId; }
    public function getSenderId(): int { return $this->senderId; }
    public function getMessage(): string { return $this->message; }
    public function getAttachments(): array { return $this->attachments; }
    public function getReadAt(): ?DateTimeImmutable { return $this->readAt; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): DateTimeImmutable { return $this->updatedAt; }

    /**
     * Set ID after persistence (for newly created entities)
     */
    public function setId(int $id): void
    {
        if ($this->id !== null) {
            throw new \LogicException('Cannot change ID of existing entity');
        }
        $this->id = $id;
    }

    /**
     * Get domain events
     */
    public function getDomainEvents(): array
    {
        return $this->domainEvents;
    }

    /**
     * Clear domain events
     */
    public function clearDomainEvents(): void
    {
        $this->domainEvents = [];
    }

    /**
     * Add domain event
     */
    private function addDomainEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }
}
