<?php

namespace App\Domain\Review\Entities;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use DateTime;

class Review
{
    private UuidValueObject $id;
    private UuidValueObject $tenantId;
    private UuidValueObject $productId;
    private ?UuidValueObject $orderId;
    private ?UuidValueObject $customerId;
    private string $reviewerName;
    private string $reviewerEmail;
    private float $rating;
    private ?string $title;
    private string $content;
    private bool $isVerifiedPurchase;
    private bool $isApproved;
    private ?DateTime $approvedAt;
    private ?UuidValueObject $approvedBy;
    private int $helpfulCount;
    private int $notHelpfulCount;
    private ?array $images;
    private DateTime $createdAt;
    private DateTime $updatedAt;

    public function __construct(
        UuidValueObject $id,
        UuidValueObject $tenantId,
        UuidValueObject $productId,
        ?UuidValueObject $orderId,
        ?UuidValueObject $customerId,
        string $reviewerName,
        string $reviewerEmail,
        float $rating,
        string $content,
        ?string $title = null,
        bool $isVerifiedPurchase = false,
        bool $isApproved = false,
        ?DateTime $approvedAt = null,
        ?UuidValueObject $approvedBy = null,
        int $helpfulCount = 0,
        int $notHelpfulCount = 0,
        ?array $images = null,
        ?DateTime $createdAt = null,
        ?DateTime $updatedAt = null
    ) {
        $this->id = $id;
        $this->tenantId = $tenantId;
        $this->productId = $productId;
        $this->orderId = $orderId;
        $this->customerId = $customerId;
        $this->reviewerName = $reviewerName;
        $this->reviewerEmail = $reviewerEmail;
        $this->rating = $rating;
        $this->title = $title;
        $this->content = $content;
        $this->isVerifiedPurchase = $isVerifiedPurchase;
        $this->isApproved = $isApproved;
        $this->approvedAt = $approvedAt;
        $this->approvedBy = $approvedBy;
        $this->helpfulCount = $helpfulCount;
        $this->notHelpfulCount = $notHelpfulCount;
        $this->images = $images;
        $this->createdAt = $createdAt ?? new DateTime();
        $this->updatedAt = $updatedAt ?? new DateTime();

        $this->validateBusinessRules();
    }

    public function getId(): UuidValueObject
    {
        return $this->id;
    }

    public function getTenantId(): UuidValueObject
    {
        return $this->tenantId;
    }

    public function getProductId(): UuidValueObject
    {
        return $this->productId;
    }

    public function getOrderId(): ?UuidValueObject
    {
        return $this->orderId;
    }

    public function getCustomerId(): ?UuidValueObject
    {
        return $this->customerId;
    }

    public function getReviewerName(): string
    {
        return $this->reviewerName;
    }

    public function getReviewerEmail(): string
    {
        return $this->reviewerEmail;
    }

    public function getRating(): float
    {
        return $this->rating;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function isVerifiedPurchase(): bool
    {
        return $this->isVerifiedPurchase;
    }

    public function isApproved(): bool
    {
        return $this->isApproved;
    }

    public function getApprovedAt(): ?DateTime
    {
        return $this->approvedAt;
    }

    public function getApprovedBy(): ?UuidValueObject
    {
        return $this->approvedBy;
    }

    public function getHelpfulCount(): int
    {
        return $this->helpfulCount;
    }

    public function getNotHelpfulCount(): int
    {
        return $this->notHelpfulCount;
    }

    public function getImages(): ?array
    {
        return $this->images;
    }

    public function getCreatedAt(): DateTime
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTime
    {
        return $this->updatedAt;
    }

    public function approve(?UuidValueObject $approvedBy = null): void
    {
        $this->isApproved = true;
        $this->approvedAt = new DateTime();
        $this->approvedBy = $approvedBy;
    }

    public function reject(): void
    {
        $this->isApproved = false;
        $this->approvedAt = null;
        $this->approvedBy = null;
    }

    public function markAsHelpful(): void
    {
        $this->helpfulCount++;
    }

    public function markAsNotHelpful(): void
    {
        $this->notHelpfulCount++;
    }

    public function getHelpfulPercentage(): float
    {
        $total = $this->helpfulCount + $this->notHelpfulCount;
        return $total > 0 ? ($this->helpfulCount / $total) * 100 : 0;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id->getValue(),
            'tenant_id' => $this->tenantId->getValue(),
            'product_id' => $this->productId->getValue(),
            'product_uuid' => $this->productId->getValue(),
            'order_id' => $this->orderId?->getValue(),
            'customer_id' => $this->customerId?->getValue(),
            'customer_name' => $this->reviewerName,
            'rating' => $this->rating,
            'title' => $this->title,
            'comment' => $this->content,
            'content' => $this->content,
            'images' => $this->images,
            'is_verified_purchase' => $this->isVerifiedPurchase,
            'verified' => $this->isVerifiedPurchase,
            'is_approved' => $this->isApproved,
            'approved_at' => $this->approvedAt?->format('Y-m-d\TH:i:s\Z'),
            'approved_by' => $this->approvedBy?->getValue(),
            'helpful_count' => $this->helpfulCount,
            'not_helpful_count' => $this->notHelpfulCount,
            'helpful_percentage' => $this->getHelpfulPercentage(),
            'created_at' => $this->createdAt->format('Y-m-d\TH:i:s\Z'),
            'updated_at' => $this->updatedAt->format('Y-m-d\TH:i:s\Z'),
        ];
    }

    private function validateBusinessRules(): void
    {
        if ($this->rating < 0 || $this->rating > 5) {
            throw new \InvalidArgumentException('Rating must be between 0 and 5');
        }

        if (empty(trim($this->reviewerName))) {
            throw new \InvalidArgumentException('Reviewer name cannot be empty');
        }

        if (empty(trim($this->reviewerEmail))) {
            throw new \InvalidArgumentException('Reviewer email cannot be empty');
        }

        if (!filter_var($this->reviewerEmail, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Invalid reviewer email format');
        }

        if (empty(trim($this->content))) {
            throw new \InvalidArgumentException('Review content cannot be empty');
        }

        if ($this->helpfulCount < 0) {
            throw new \InvalidArgumentException('Helpful count cannot be negative');
        }

        if ($this->notHelpfulCount < 0) {
            throw new \InvalidArgumentException('Not helpful count cannot be negative');
        }
    }
}
