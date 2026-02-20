<?php

declare(strict_types=1);

namespace App\Domain\CustomerQuote\Entities;

use DateTimeImmutable;
use DomainException;

/**
 * OrderDocument Domain Entity
 * 
 * Represents a document associated with an order (quotation, invoice, etc.)
 */
class OrderDocument
{
    private ?int $id = null;
    private ?string $uuid = null;
    private array $accessLog = [];
    private array $metadata = [];

    private function __construct(
        private int $tenantId,
        private int $orderId,
        private string $documentType,
        private string $documentNumber,
        private DateTimeImmutable $documentDate,
        private ?int $customerQuoteId,
        private ?int $vendorQuoteId,
        private ?int $paymentId,
        private string $title,
        private ?string $description,
        private string $fileUrl,
        private int $fileSize,
        private string $fileType,
        private int $version,
        private ?int $parentDocumentId,
        private bool $isLatestVersion,
        private string $status,
        private DateTimeImmutable $generatedAt,
        private ?DateTimeImmutable $sentAt,
        private ?DateTimeImmutable $acknowledgedAt,
        private ?DateTimeImmutable $completedAt,
        private int $generatedBy,
        private ?int $sentBy,
        private ?int $acknowledgedBy,
        private ?string $recipientType,
        private ?int $recipientId,
        private ?string $recipientEmail,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
        private ?DateTimeImmutable $deletedAt
    ) {}

    /**
     * Create a new OrderDocument
     */
    public static function create(array $data): self
    {
        $now = new DateTimeImmutable();
        
        return new self(
            tenantId: $data['tenant_id'],
            orderId: $data['order_id'],
            documentType: $data['document_type'],
            documentNumber: $data['document_number'],
            documentDate: new DateTimeImmutable($data['document_date'] ?? 'now'),
            customerQuoteId: $data['customer_quote_id'] ?? null,
            vendorQuoteId: $data['vendor_quote_id'] ?? null,
            paymentId: $data['payment_id'] ?? null,
            title: $data['title'],
            description: $data['description'] ?? null,
            fileUrl: $data['file_url'],
            fileSize: $data['file_size'],
            fileType: $data['file_type'],
            version: $data['version'] ?? 1,
            parentDocumentId: $data['parent_document_id'] ?? null,
            isLatestVersion: $data['is_latest_version'] ?? true,
            status: $data['status'] ?? 'draft',
            generatedAt: $now,
            sentAt: null,
            acknowledgedAt: null,
            completedAt: null,
            generatedBy: $data['generated_by'],
            sentBy: null,
            acknowledgedBy: null,
            recipientType: $data['recipient_type'] ?? null,
            recipientId: $data['recipient_id'] ?? null,
            recipientEmail: $data['recipient_email'] ?? null,
            createdAt: $now,
            updatedAt: $now,
            deletedAt: null
        );
    }

    /**
     * Reconstruct from array
     */
    public static function fromArray(array $data): self
    {
        $document = new self(
            tenantId: $data['tenant_id'],
            orderId: $data['order_id'],
            documentType: $data['document_type'],
            documentNumber: $data['document_number'],
            documentDate: new DateTimeImmutable($data['document_date']),
            customerQuoteId: $data['customer_quote_id'] ?? null,
            vendorQuoteId: $data['vendor_quote_id'] ?? null,
            paymentId: $data['payment_id'] ?? null,
            title: $data['title'],
            description: $data['description'] ?? null,
            fileUrl: $data['file_url'],
            fileSize: $data['file_size'],
            fileType: $data['file_type'],
            version: $data['version'],
            parentDocumentId: $data['parent_document_id'] ?? null,
            isLatestVersion: $data['is_latest_version'],
            status: $data['status'],
            generatedAt: new DateTimeImmutable($data['generated_at']),
            sentAt: isset($data['sent_at']) ? new DateTimeImmutable($data['sent_at']) : null,
            acknowledgedAt: isset($data['acknowledged_at']) ? new DateTimeImmutable($data['acknowledged_at']) : null,
            completedAt: isset($data['completed_at']) ? new DateTimeImmutable($data['completed_at']) : null,
            generatedBy: $data['generated_by'],
            sentBy: $data['sent_by'] ?? null,
            acknowledgedBy: $data['acknowledged_by'] ?? null,
            recipientType: $data['recipient_type'] ?? null,
            recipientId: $data['recipient_id'] ?? null,
            recipientEmail: $data['recipient_email'] ?? null,
            createdAt: new DateTimeImmutable($data['created_at']),
            updatedAt: new DateTimeImmutable($data['updated_at']),
            deletedAt: isset($data['deleted_at']) ? new DateTimeImmutable($data['deleted_at']) : null
        );
        
        $document->id = $data['id'] ?? null;
        $document->uuid = $data['uuid'] ?? null;
        $document->accessLog = $data['access_log'] ?? [];
        $document->metadata = $data['metadata'] ?? [];
        
        return $document;
    }

    // Business Logic Methods

    /**
     * Mark document as sent
     */
    public function markAsSent(int $sentBy): void
    {
        if ($this->status !== 'draft') {
            throw new DomainException('Only draft documents can be sent');
        }
        
        $this->status = 'sent';
        $this->sentAt = new DateTimeImmutable();
        $this->sentBy = $sentBy;
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Mark document as acknowledged
     */
    public function markAsAcknowledged(int $acknowledgedBy): void
    {
        if ($this->status !== 'sent') {
            throw new DomainException('Only sent documents can be acknowledged');
        }
        
        $this->status = 'acknowledged';
        $this->acknowledgedAt = new DateTimeImmutable();
        $this->acknowledgedBy = $acknowledgedBy;
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Mark document as paid
     */
    public function markAsPaid(): void
    {
        if (!in_array($this->status, ['sent', 'acknowledged'])) {
            throw new DomainException('Document must be sent or acknowledged to mark as paid');
        }
        
        $this->status = 'paid';
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Mark document as completed
     */
    public function markAsCompleted(): void
    {
        if (!in_array($this->status, ['sent', 'acknowledged', 'paid', 'delivered'])) {
            throw new DomainException('Invalid status transition to completed');
        }
        
        $this->status = 'completed';
        $this->completedAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Cancel document
     */
    public function cancel(): void
    {
        if (in_array($this->status, ['completed', 'cancelled'])) {
            throw new DomainException('Cannot cancel completed or already cancelled document');
        }
        
        $this->status = 'cancelled';
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Log document access
     */
    public function logAccess(int $userId, string $action, string $ipAddress): void
    {
        $this->accessLog[] = [
            'accessed_by' => $userId,
            'accessed_at' => (new DateTimeImmutable())->format('Y-m-d H:i:s'),
            'ip_address' => $ipAddress,
            'action' => $action,
        ];
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Update metadata
     */
    public function updateMetadata(string $key, mixed $value): void
    {
        $this->metadata[$key] = $value;
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Create new version
     */
    public function createNewVersion(): void
    {
        $this->isLatestVersion = false;
        $this->updatedAt = new DateTimeImmutable();
    }

    // Getters

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUuid(): ?string
    {
        return $this->uuid;
    }

    public function getTenantId(): int
    {
        return $this->tenantId;
    }

    public function getOrderId(): int
    {
        return $this->orderId;
    }

    public function getDocumentType(): string
    {
        return $this->documentType;
    }

    public function getDocumentNumber(): string
    {
        return $this->documentNumber;
    }

    public function getDocumentDate(): DateTimeImmutable
    {
        return $this->documentDate;
    }

    public function getCustomerQuoteId(): ?int
    {
        return $this->customerQuoteId;
    }

    public function getVendorQuoteId(): ?int
    {
        return $this->vendorQuoteId;
    }

    public function getPaymentId(): ?int
    {
        return $this->paymentId;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getFileUrl(): string
    {
        return $this->fileUrl;
    }

    public function getFileSize(): int
    {
        return $this->fileSize;
    }

    public function getFileType(): string
    {
        return $this->fileType;
    }

    public function getVersion(): int
    {
        return $this->version;
    }

    public function getParentDocumentId(): ?int
    {
        return $this->parentDocumentId;
    }

    public function isLatestVersion(): bool
    {
        return $this->isLatestVersion;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getGeneratedAt(): DateTimeImmutable
    {
        return $this->generatedAt;
    }

    public function getSentAt(): ?DateTimeImmutable
    {
        return $this->sentAt;
    }

    public function getAcknowledgedAt(): ?DateTimeImmutable
    {
        return $this->acknowledgedAt;
    }

    public function getCompletedAt(): ?DateTimeImmutable
    {
        return $this->completedAt;
    }

    public function getGeneratedBy(): int
    {
        return $this->generatedBy;
    }

    public function getSentBy(): ?int
    {
        return $this->sentBy;
    }

    public function getAcknowledgedBy(): ?int
    {
        return $this->acknowledgedBy;
    }

    public function getRecipientType(): ?string
    {
        return $this->recipientType;
    }

    public function getRecipientId(): ?int
    {
        return $this->recipientId;
    }

    public function getRecipientEmail(): ?string
    {
        return $this->recipientEmail;
    }

    public function getAccessLog(): array
    {
        return $this->accessLog;
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getDeletedAt(): ?DateTimeImmutable
    {
        return $this->deletedAt;
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'tenant_id' => $this->tenantId,
            'order_id' => $this->orderId,
            'document_type' => $this->documentType,
            'document_number' => $this->documentNumber,
            'document_date' => $this->documentDate->format('Y-m-d H:i:s'),
            'customer_quote_id' => $this->customerQuoteId,
            'vendor_quote_id' => $this->vendorQuoteId,
            'payment_id' => $this->paymentId,
            'title' => $this->title,
            'description' => $this->description,
            'file_url' => $this->fileUrl,
            'file_size' => $this->fileSize,
            'file_type' => $this->fileType,
            'version' => $this->version,
            'parent_document_id' => $this->parentDocumentId,
            'is_latest_version' => $this->isLatestVersion,
            'status' => $this->status,
            'generated_at' => $this->generatedAt->format('Y-m-d H:i:s'),
            'sent_at' => $this->sentAt?->format('Y-m-d H:i:s'),
            'acknowledged_at' => $this->acknowledgedAt?->format('Y-m-d H:i:s'),
            'completed_at' => $this->completedAt?->format('Y-m-d H:i:s'),
            'generated_by' => $this->generatedBy,
            'sent_by' => $this->sentBy,
            'acknowledged_by' => $this->acknowledgedBy,
            'recipient_type' => $this->recipientType,
            'recipient_id' => $this->recipientId,
            'recipient_email' => $this->recipientEmail,
            'access_log' => $this->accessLog,
            'metadata' => $this->metadata,
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
            'deleted_at' => $this->deletedAt?->format('Y-m-d H:i:s'),
        ];
    }
}
