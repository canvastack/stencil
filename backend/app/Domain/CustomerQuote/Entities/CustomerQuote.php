<?php

declare(strict_types=1);

namespace App\Domain\CustomerQuote\Entities;

use DateTimeImmutable;
use DomainException;

/**
 * CustomerQuote Domain Entity
 * 
 * Rich domain model representing a customer quote with business logic.
 * This is a pure PHP class with no Laravel dependencies.
 */
class CustomerQuote
{
    private ?int $id = null;
    private ?string $uuid = null;
    private array $history = [];
    private array $metadata = [];

    private function __construct(
        private int $tenantId,
        private int $orderId,
        private int $vendorQuoteId,
        private string $quoteNumber,
        private string $title,
        private ?string $description,
        
        // Pricing (all in cents)
        private int $vendorTotalCost,
        private int $baseProfitAmount,
        private float $baseProfitPercentage,
        
        // Additional costs
        private int $handlingFee,
        private int $shippingCost,
        private int $insurance,
        private int $otherCosts,
        private ?string $otherCostsDescription,
        
        // Final pricing
        private int $subtotal,
        private float $taxRate,
        private int $taxAmount,
        private int $grandTotal,
        
        // Profit summary
        private int $totalProfitAmount,
        private float $totalProfitPercentage,
        
        private string $currency,
        
        // Terms
        private DateTimeImmutable $validUntil,
        private string $paymentTerms,
        private ?string $deliveryTimeline,
        private ?string $termsAndConditions,
        
        // Status & workflow
        private string $status,
        
        // Timestamps
        private ?DateTimeImmutable $sentAt,
        private ?DateTimeImmutable $viewedAt,
        private ?DateTimeImmutable $respondedAt,
        private ?DateTimeImmutable $approvedAt,
        private ?DateTimeImmutable $rejectedAt,
        private ?DateTimeImmutable $expiredAt,
        
        // Actors
        private int $createdBy,
        private ?int $approvedBy,
        private ?int $rejectedBy,
        
        // Negotiation
        private ?int $counterOfferAmount,
        private ?string $counterOfferNotes,
        private int $counterOfferRound,
        private int $maxNegotiationRounds,
        
        // Approval
        private ?string $approvalMethod,
        private ?string $approvalReason,
        private ?string $approvalNotes,
        
        // Response token
        private string $responseToken,
        
        // Timestamps
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt
    ) {}

    /**
     * Create a new CustomerQuote
     */
    public static function create(array $data): self
    {
        $now = new DateTimeImmutable();
        
        return new self(
            tenantId: $data['tenant_id'],
            orderId: $data['order_id'],
            vendorQuoteId: $data['vendor_quote_id'],
            quoteNumber: $data['quote_number'],
            title: $data['title'],
            description: $data['description'] ?? null,
            
            vendorTotalCost: $data['vendor_total_cost'],
            baseProfitAmount: $data['base_profit_amount'],
            baseProfitPercentage: $data['base_profit_percentage'],
            
            handlingFee: $data['handling_fee'] ?? 0,
            shippingCost: $data['shipping_cost'] ?? 0,
            insurance: $data['insurance'] ?? 0,
            otherCosts: $data['other_costs'] ?? 0,
            otherCostsDescription: $data['other_costs_description'] ?? null,
            
            subtotal: $data['subtotal'],
            taxRate: $data['tax_rate'] ?? 0.11,
            taxAmount: $data['tax_amount'],
            grandTotal: $data['grand_total'],
            
            totalProfitAmount: $data['total_profit_amount'],
            totalProfitPercentage: $data['total_profit_percentage'],
            
            currency: $data['currency'] ?? 'IDR',
            
            validUntil: new DateTimeImmutable($data['valid_until']),
            paymentTerms: $data['payment_terms'],
            deliveryTimeline: $data['delivery_timeline'] ?? null,
            termsAndConditions: $data['terms_and_conditions'] ?? null,
            
            status: $data['status'] ?? 'draft',
            
            sentAt: null,
            viewedAt: null,
            respondedAt: null,
            approvedAt: null,
            rejectedAt: null,
            expiredAt: null,
            
            createdBy: $data['created_by'],
            approvedBy: null,
            rejectedBy: null,
            
            counterOfferAmount: null,
            counterOfferNotes: null,
            counterOfferRound: 0,
            maxNegotiationRounds: $data['max_negotiation_rounds'] ?? 3,
            
            approvalMethod: null,
            approvalReason: null,
            approvalNotes: null,
            
            responseToken: $data['response_token'],
            
            createdAt: $now,
            updatedAt: $now
        );
    }

    /**
     * Reconstruct from array (for repository)
     */
    public static function fromArray(array $data): self
    {
        $quote = new self(
            tenantId: $data['tenant_id'],
            orderId: $data['order_id'],
            vendorQuoteId: $data['vendor_quote_id'],
            quoteNumber: $data['quote_number'],
            title: $data['title'],
            description: $data['description'] ?? null,
            
            vendorTotalCost: $data['vendor_total_cost'],
            baseProfitAmount: $data['base_profit_amount'],
            baseProfitPercentage: $data['base_profit_percentage'],
            
            handlingFee: $data['handling_fee'] ?? 0,
            shippingCost: $data['shipping_cost'] ?? 0,
            insurance: $data['insurance'] ?? 0,
            otherCosts: $data['other_costs'] ?? 0,
            otherCostsDescription: $data['other_costs_description'] ?? null,
            
            subtotal: $data['subtotal'],
            taxRate: $data['tax_rate'],
            taxAmount: $data['tax_amount'],
            grandTotal: $data['grand_total'],
            
            totalProfitAmount: $data['total_profit_amount'],
            totalProfitPercentage: $data['total_profit_percentage'],
            
            currency: $data['currency'],
            
            validUntil: new DateTimeImmutable($data['valid_until']),
            paymentTerms: $data['payment_terms'],
            deliveryTimeline: $data['delivery_timeline'] ?? null,
            termsAndConditions: $data['terms_and_conditions'] ?? null,
            
            status: $data['status'],
            
            sentAt: isset($data['sent_at']) ? new DateTimeImmutable($data['sent_at']) : null,
            viewedAt: isset($data['viewed_at']) ? new DateTimeImmutable($data['viewed_at']) : null,
            respondedAt: isset($data['responded_at']) ? new DateTimeImmutable($data['responded_at']) : null,
            approvedAt: isset($data['approved_at']) ? new DateTimeImmutable($data['approved_at']) : null,
            rejectedAt: isset($data['rejected_at']) ? new DateTimeImmutable($data['rejected_at']) : null,
            expiredAt: isset($data['expired_at']) ? new DateTimeImmutable($data['expired_at']) : null,
            
            createdBy: $data['created_by'],
            approvedBy: $data['approved_by'] ?? null,
            rejectedBy: $data['rejected_by'] ?? null,
            
            counterOfferAmount: $data['counter_offer_amount'] ?? null,
            counterOfferNotes: $data['counter_offer_notes'] ?? null,
            counterOfferRound: $data['counter_offer_round'] ?? 0,
            maxNegotiationRounds: $data['max_negotiation_rounds'] ?? 3,
            
            approvalMethod: $data['approval_method'] ?? null,
            approvalReason: $data['approval_reason'] ?? null,
            approvalNotes: $data['approval_notes'] ?? null,
            
            responseToken: $data['response_token'],
            
            createdAt: new DateTimeImmutable($data['created_at']),
            updatedAt: new DateTimeImmutable($data['updated_at'])
        );
        
        $quote->id = $data['id'] ?? null;
        $quote->uuid = $data['uuid'] ?? null;
        $quote->history = $data['history'] ?? [];
        $quote->metadata = $data['metadata'] ?? [];
        
        return $quote;
    }

    // Business Logic Methods

    /**
     * Mark quote as sent to customer
     */
    public function markAsSent(int $sentBy): void
    {
        if ($this->status !== 'draft') {
            throw new DomainException('Only draft quotes can be sent');
        }
        
        if ($this->isExpired()) {
            throw new DomainException('Cannot send expired quote');
        }
        
        $this->status = 'sent';
        $this->sentAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Mark quote as viewed by customer
     */
    public function markAsViewed(): void
    {
        if ($this->status === 'sent' && $this->viewedAt === null) {
            $this->status = 'viewed';
            $this->viewedAt = new DateTimeImmutable();
            $this->updatedAt = new DateTimeImmutable();
        }
    }

    /**
     * Accept the quote
     */
    public function accept(int $customerId, string $approvalMethod, ?string $approvalReason = null): void
    {
        if (!in_array($this->status, ['sent', 'viewed'])) {
            throw new DomainException('Quote cannot be accepted in current status');
        }
        
        if ($this->isExpired()) {
            throw new DomainException('Cannot accept expired quote');
        }
        
        if ($approvalMethod === 'auto') {
            $this->status = 'accepted';
            $this->approvedAt = new DateTimeImmutable();
        } else {
            $this->status = 'pending_approval';
        }
        
        $this->respondedAt = new DateTimeImmutable();
        $this->approvalMethod = $approvalMethod;
        $this->approvalReason = $approvalReason;
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Approve quote (admin action)
     */
    public function approve(int $approvedBy, ?string $notes = null): void
    {
        if ($this->status !== 'pending_approval') {
            throw new DomainException('Only pending approval quotes can be approved');
        }
        
        $this->status = 'accepted';
        $this->approvedAt = new DateTimeImmutable();
        $this->approvedBy = $approvedBy;
        $this->approvalNotes = $notes;
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Reject the quote
     */
    public function reject(int $rejectedBy, string $reason): void
    {
        if (!in_array($this->status, ['sent', 'viewed', 'pending_approval', 'countered'])) {
            throw new DomainException('Quote cannot be rejected in current status');
        }
        
        $this->status = 'rejected';
        $this->rejectedAt = new DateTimeImmutable();
        $this->rejectedBy = $rejectedBy;
        $this->approvalNotes = $reason;
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Submit counter offer
     */
    public function submitCounterOffer(int $counterAmount, string $notes): void
    {
        if (!in_array($this->status, ['sent', 'viewed'])) {
            throw new DomainException('Quote cannot be countered in current status');
        }
        
        if ($this->isExpired()) {
            throw new DomainException('Cannot counter expired quote');
        }
        
        if ($this->counterOfferRound >= $this->maxNegotiationRounds) {
            throw new DomainException('Maximum negotiation rounds reached');
        }
        
        $this->status = 'countered';
        $this->counterOfferAmount = $counterAmount;
        $this->counterOfferNotes = $notes;
        $this->counterOfferRound++;
        $this->respondedAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Accept counter offer (admin action)
     */
    public function acceptCounterOffer(int $approvedBy): void
    {
        if ($this->status !== 'countered') {
            throw new DomainException('No counter offer to accept');
        }
        
        $this->grandTotal = $this->counterOfferAmount;
        $this->status = 'accepted';
        $this->approvedAt = new DateTimeImmutable();
        $this->approvedBy = $approvedBy;
        $this->approvalMethod = 'manual';
        $this->approvalNotes = 'Counter offer accepted';
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Send admin counter offer
     */
    public function sendAdminCounter(int $newAmount, int $sentBy): void
    {
        if ($this->status !== 'countered') {
            throw new DomainException('No counter offer to respond to');
        }
        
        if ($this->counterOfferRound >= $this->maxNegotiationRounds) {
            throw new DomainException('Maximum negotiation rounds reached');
        }
        
        $this->grandTotal = $newAmount;
        $this->status = 'sent';
        $this->counterOfferRound++;
        $this->sentAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Mark quote as expired
     */
    public function markAsExpired(): void
    {
        if (in_array($this->status, ['sent', 'viewed', 'countered'])) {
            $this->status = 'expired';
            $this->expiredAt = new DateTimeImmutable();
            $this->updatedAt = new DateTimeImmutable();
        }
    }

    /**
     * Check if quote is expired
     */
    public function isExpired(): bool
    {
        return $this->validUntil < new DateTimeImmutable();
    }

    /**
     * Check if negotiation is allowed
     */
    public function canNegotiate(): bool
    {
        return $this->counterOfferRound < $this->maxNegotiationRounds 
            && !$this->isExpired()
            && in_array($this->status, ['sent', 'viewed', 'countered']);
    }

    /**
     * Add history entry
     */
    public function addHistoryEntry(array $entry): void
    {
        $this->history[] = $entry;
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

    public function getVendorQuoteId(): int
    {
        return $this->vendorQuoteId;
    }

    public function getQuoteNumber(): string
    {
        return $this->quoteNumber;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getVendorTotalCost(): int
    {
        return $this->vendorTotalCost;
    }

    public function getBaseProfitAmount(): int
    {
        return $this->baseProfitAmount;
    }

    public function getBaseProfitPercentage(): float
    {
        return $this->baseProfitPercentage;
    }

    public function getHandlingFee(): int
    {
        return $this->handlingFee;
    }

    public function getShippingCost(): int
    {
        return $this->shippingCost;
    }

    public function getInsurance(): int
    {
        return $this->insurance;
    }

    public function getOtherCosts(): int
    {
        return $this->otherCosts;
    }

    public function getOtherCostsDescription(): ?string
    {
        return $this->otherCostsDescription;
    }

    public function getSubtotal(): int
    {
        return $this->subtotal;
    }

    public function getTaxRate(): float
    {
        return $this->taxRate;
    }

    public function getTaxAmount(): int
    {
        return $this->taxAmount;
    }

    public function getGrandTotal(): int
    {
        return $this->grandTotal;
    }

    public function getTotalProfitAmount(): int
    {
        return $this->totalProfitAmount;
    }

    public function getTotalProfitPercentage(): float
    {
        return $this->totalProfitPercentage;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function getValidUntil(): DateTimeImmutable
    {
        return $this->validUntil;
    }

    public function getPaymentTerms(): string
    {
        return $this->paymentTerms;
    }

    public function getDeliveryTimeline(): ?string
    {
        return $this->deliveryTimeline;
    }

    public function getTermsAndConditions(): ?string
    {
        return $this->termsAndConditions;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getSentAt(): ?DateTimeImmutable
    {
        return $this->sentAt;
    }

    public function getViewedAt(): ?DateTimeImmutable
    {
        return $this->viewedAt;
    }

    public function getRespondedAt(): ?DateTimeImmutable
    {
        return $this->respondedAt;
    }

    public function getApprovedAt(): ?DateTimeImmutable
    {
        return $this->approvedAt;
    }

    public function getRejectedAt(): ?DateTimeImmutable
    {
        return $this->rejectedAt;
    }

    public function getExpiredAt(): ?DateTimeImmutable
    {
        return $this->expiredAt;
    }

    public function getCreatedBy(): int
    {
        return $this->createdBy;
    }

    public function getApprovedBy(): ?int
    {
        return $this->approvedBy;
    }

    public function getRejectedBy(): ?int
    {
        return $this->rejectedBy;
    }

    public function getCounterOfferAmount(): ?int
    {
        return $this->counterOfferAmount;
    }

    public function getCounterOfferNotes(): ?string
    {
        return $this->counterOfferNotes;
    }

    public function getCounterOfferRound(): int
    {
        return $this->counterOfferRound;
    }

    public function getMaxNegotiationRounds(): int
    {
        return $this->maxNegotiationRounds;
    }

    public function getApprovalMethod(): ?string
    {
        return $this->approvalMethod;
    }

    public function getApprovalReason(): ?string
    {
        return $this->approvalReason;
    }

    public function getApprovalNotes(): ?string
    {
        return $this->approvalNotes;
    }

    public function getResponseToken(): string
    {
        return $this->responseToken;
    }

    public function getHistory(): array
    {
        return $this->history;
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

    /**
     * Convert to array for persistence
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'tenant_id' => $this->tenantId,
            'order_id' => $this->orderId,
            'vendor_quote_id' => $this->vendorQuoteId,
            'quote_number' => $this->quoteNumber,
            'title' => $this->title,
            'description' => $this->description,
            
            'vendor_total_cost' => $this->vendorTotalCost,
            'base_profit_amount' => $this->baseProfitAmount,
            'base_profit_percentage' => $this->baseProfitPercentage,
            
            'handling_fee' => $this->handlingFee,
            'shipping_cost' => $this->shippingCost,
            'insurance' => $this->insurance,
            'other_costs' => $this->otherCosts,
            'other_costs_description' => $this->otherCostsDescription,
            
            'subtotal' => $this->subtotal,
            'tax_rate' => $this->taxRate,
            'tax_amount' => $this->taxAmount,
            'grand_total' => $this->grandTotal,
            
            'total_profit_amount' => $this->totalProfitAmount,
            'total_profit_percentage' => $this->totalProfitPercentage,
            
            'currency' => $this->currency,
            
            'valid_until' => $this->validUntil->format('Y-m-d H:i:s'),
            'payment_terms' => $this->paymentTerms,
            'delivery_timeline' => $this->deliveryTimeline,
            'terms_and_conditions' => $this->termsAndConditions,
            
            'status' => $this->status,
            
            'sent_at' => $this->sentAt?->format('Y-m-d H:i:s'),
            'viewed_at' => $this->viewedAt?->format('Y-m-d H:i:s'),
            'responded_at' => $this->respondedAt?->format('Y-m-d H:i:s'),
            'approved_at' => $this->approvedAt?->format('Y-m-d H:i:s'),
            'rejected_at' => $this->rejectedAt?->format('Y-m-d H:i:s'),
            'expired_at' => $this->expiredAt?->format('Y-m-d H:i:s'),
            
            'created_by' => $this->createdBy,
            'approved_by' => $this->approvedBy,
            'rejected_by' => $this->rejectedBy,
            
            'counter_offer_amount' => $this->counterOfferAmount,
            'counter_offer_notes' => $this->counterOfferNotes,
            'counter_offer_round' => $this->counterOfferRound,
            'max_negotiation_rounds' => $this->maxNegotiationRounds,
            
            'approval_method' => $this->approvalMethod,
            'approval_reason' => $this->approvalReason,
            'approval_notes' => $this->approvalNotes,
            
            'response_token' => $this->responseToken,
            
            'history' => $this->history,
            'metadata' => $this->metadata,
            
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
        ];
    }
}
