<?php

declare(strict_types=1);

namespace App\Domain\Notification\Entities;

use DateTimeImmutable;
use InvalidArgumentException;

/**
 * Notification Domain Entity
 * 
 * Represents a notification sent to users for quote-related events.
 * Encapsulates notification business rules and maintains data consistency.
 * 
 * Database Integration:
 * - Maps to notifications table
 * - Uses UUID for public identification
 * - Stores flexible data in JSON field
 * 
 * Business Rules:
 * - Notifications can only be marked as read once
 * - Data field stores event-specific information
 * - Type field identifies notification category
 */
class Notification
{
    private function __construct(
        private ?int $id,
        private string $uuid,
        private int $tenantId,
        private int $userId,
        private string $type,
        private string $title,
        private string $message,
        private array $data,
        private ?DateTimeImmutable $readAt,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt
    ) {}

    /**
     * Create new notification
     */
    public static function create(
        int $tenantId,
        int $userId,
        string $type,
        string $title,
        string $message,
        array $data = []
    ): self {
        $now = new DateTimeImmutable();
        $uuid = \Illuminate\Support\Str::uuid()->toString();
        
        self::validateType($type);
        self::validateTitle($title);
        self::validateMessage($message);

        return new self(
            id: null,
            uuid: $uuid,
            tenantId: $tenantId,
            userId: $userId,
            type: $type,
            title: $title,
            message: $message,
            data: $data,
            readAt: null,
            createdAt: $now,
            updatedAt: $now
        );
    }

    /**
     * Reconstitute notification from persistence data
     */
    public static function reconstitute(
        int $id,
        string $uuid,
        int $tenantId,
        int $userId,
        string $type,
        string $title,
        string $message,
        ?array $data,
        ?DateTimeImmutable $readAt,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt
    ): self {
        return new self(
            id: $id,
            uuid: $uuid,
            tenantId: $tenantId,
            userId: $userId,
            type: $type,
            title: $title,
            message: $message,
            data: $data ?? [],
            readAt: $readAt,
            createdAt: $createdAt,
            updatedAt: $updatedAt
        );
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(): void
    {
        if ($this->readAt !== null) {
            // Already read, no-op
            return;
        }

        $this->readAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Check if notification is read
     */
    public function isRead(): bool
    {
        return $this->readAt !== null;
    }

    /**
     * Check if notification is unread
     */
    public function isUnread(): bool
    {
        return $this->readAt === null;
    }

    /**
     * Factory method for quote received notification
     */
    public static function quoteReceived(
        int $tenantId,
        int $userId,
        string $quoteUuid,
        string $quoteNumber,
        string $orderUuid,
        string $customerName,
        string $productName,
        int $quantity
    ): self {
        return self::create(
            tenantId: $tenantId,
            userId: $userId,
            type: 'quote_received',
            title: 'New Quote Request',
            message: "You have received a new quote request #{$quoteNumber}",
            data: [
                'quote_uuid' => $quoteUuid,
                'quote_number' => $quoteNumber,
                'order_uuid' => $orderUuid,
                'customer_name' => $customerName,
                'product_name' => $productName,
                'quantity' => $quantity
            ]
        );
    }

    /**
     * Factory method for quote response notification
     */
    public static function quoteResponse(
        int $tenantId,
        int $userId,
        string $quoteUuid,
        string $quoteNumber,
        string $responseType,
        string $vendorName,
        ?string $responseNotes = null
    ): self {
        $responseLabel = match($responseType) {
            'accept' => 'accepted',
            'reject' => 'rejected',
            'counter' => 'countered',
            default => $responseType
        };

        return self::create(
            tenantId: $tenantId,
            userId: $userId,
            type: 'quote_response',
            title: 'Vendor Responded to Quote',
            message: "Vendor {$vendorName} has {$responseLabel} quote #{$quoteNumber}",
            data: [
                'quote_uuid' => $quoteUuid,
                'quote_number' => $quoteNumber,
                'response_type' => $responseType,
                'vendor_name' => $vendorName,
                'response_notes' => $responseNotes
            ]
        );
    }

    /**
     * Factory method for quote expired notification
     */
    public static function quoteExpired(
        int $tenantId,
        int $userId,
        string $quoteUuid,
        string $quoteNumber,
        string $vendorName
    ): self {
        return self::create(
            tenantId: $tenantId,
            userId: $userId,
            type: 'quote_expired',
            title: 'Quote Expired',
            message: "Quote #{$quoteNumber} to {$vendorName} has expired without response",
            data: [
                'quote_uuid' => $quoteUuid,
                'quote_number' => $quoteNumber,
                'vendor_name' => $vendorName
            ]
        );
    }

    /**
     * Factory method for quote extended notification
     */
    public static function quoteExtended(
        int $tenantId,
        int $userId,
        string $quoteUuid,
        string $quoteNumber,
        DateTimeImmutable $newExpiresAt
    ): self {
        return self::create(
            tenantId: $tenantId,
            userId: $userId,
            type: 'quote_extended',
            title: 'Quote Expiration Extended',
            message: "Quote #{$quoteNumber} expiration has been extended to {$newExpiresAt->format('Y-m-d')}",
            data: [
                'quote_uuid' => $quoteUuid,
                'quote_number' => $quoteNumber,
                'new_expires_at' => $newExpiresAt->format('c')
            ]
        );
    }

    /**
     * Factory method for message received notification
     */
    public static function messageReceived(
        int $tenantId,
        int $userId,
        string $messageUuid,
        string $quoteUuid,
        string $quoteNumber,
        string $senderName,
        string $messagePreview
    ): self {
        return self::create(
            tenantId: $tenantId,
            userId: $userId,
            type: 'message_received',
            title: 'New Message on Quote',
            message: "{$senderName} sent a message on quote #{$quoteNumber}",
            data: [
                'message_uuid' => $messageUuid,
                'quote_uuid' => $quoteUuid,
                'quote_number' => $quoteNumber,
                'sender_name' => $senderName,
                'message_preview' => $messagePreview
            ]
        );
    }

    // Validation methods
    private static function validateType(string $type): void
    {
        if (empty(trim($type))) {
            throw new InvalidArgumentException('Notification type cannot be empty');
        }

        if (strlen($type) > 100) {
            throw new InvalidArgumentException('Notification type cannot exceed 100 characters');
        }
    }

    private static function validateTitle(string $title): void
    {
        if (empty(trim($title))) {
            throw new InvalidArgumentException('Notification title cannot be empty');
        }

        if (strlen($title) > 255) {
            throw new InvalidArgumentException('Notification title cannot exceed 255 characters');
        }
    }

    private static function validateMessage(string $message): void
    {
        if (empty(trim($message))) {
            throw new InvalidArgumentException('Notification message cannot be empty');
        }
    }

    // Getters
    public function getId(): ?int { return $this->id; }
    public function getUuid(): string { return $this->uuid; }
    public function getTenantId(): int { return $this->tenantId; }
    public function getUserId(): int { return $this->userId; }
    public function getType(): string { return $this->type; }
    public function getTitle(): string { return $this->title; }
    public function getMessage(): string { return $this->message; }
    public function getData(): array { return $this->data; }
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
}
