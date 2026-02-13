<?php

declare(strict_types=1);

namespace App\Domain\Quote\Entities;

use App\Domain\Quote\ValueObjects\QuoteStatus;
use App\Domain\Quote\Events\QuoteCreated;
use App\Domain\Quote\Events\QuoteStatusChanged;
use App\Domain\Quote\Events\QuoteSentToVendor;
use App\Domain\Quote\Events\VendorRespondedToQuote;
use App\Domain\Quote\Exceptions\InvalidStatusTransitionException;
use App\Domain\Quote\Exceptions\QuoteExpiredException;
use DateTimeImmutable;
use InvalidArgumentException;

/**
 * Quote Domain Entity
 * 
 * Represents a quote request sent to vendors for custom etching products.
 * Encapsulates quote business rules and maintains data consistency.
 * 
 * Database Integration:
 * - Maps to order_vendor_negotiations table
 * - Uses existing field names and structures
 * - Maintains UUID for public identification
 * - Follows JSON-based storage for flexible data (quote_details, history)
 * 
 * Business Rules:
 * - Status transitions must follow QuoteStatus validation rules
 * - All status changes are audited in status_history
 * - Expired quotes cannot be modified
 * - Vendor responses update status and timestamps
 */
class Quote
{
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private string $uuid,
        private int $tenantId,
        private int $orderId,
        private int $vendorId,
        private int $productId,
        private int $quantity,
        private array $specifications,
        private ?string $notes,
        private QuoteStatus $status,
        private ?int $initialOffer,
        private ?int $latestOffer,
        private string $currency,
        private ?array $quoteDetails,
        private array $history,
        private array $statusHistory,
        private int $round,
        private ?DateTimeImmutable $sentAt,
        private ?DateTimeImmutable $respondedAt,
        private ?string $responseType,
        private ?string $responseNotes,
        private ?DateTimeImmutable $expiresAt,
        private ?DateTimeImmutable $closedAt,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
        private ?DateTimeImmutable $deletedAt = null
    ) {}

    /**
     * Create new quote
     */
    public static function create(
        int $tenantId,
        int $orderId,
        int $vendorId,
        int $productId,
        int $quantity,
        array $specifications = [],
        ?string $notes = null,
        ?int $initialOffer = null,
        ?array $quoteDetails = null,
        string $currency = 'IDR',
        ?DateTimeImmutable $expiresAt = null
    ): self {
        $now = new DateTimeImmutable();
        $uuid = \Illuminate\Support\Str::uuid()->toString();
        
        // Set default expiration (30 days from now)
        if ($expiresAt === null) {
            $expiresAt = $now->modify('+30 days');
        }

        $quote = new self(
            id: null,
            uuid: $uuid,
            tenantId: $tenantId,
            orderId: $orderId,
            vendorId: $vendorId,
            productId: $productId,
            quantity: $quantity,
            specifications: $specifications,
            notes: $notes,
            status: QuoteStatus::DRAFT,
            initialOffer: $initialOffer,
            latestOffer: $initialOffer,
            currency: $currency,
            quoteDetails: $quoteDetails ?? [],
            history: [],
            statusHistory: [
                [
                    'from' => null,
                    'to' => QuoteStatus::DRAFT->value,
                    'changed_by' => null,
                    'changed_at' => $now->format('c'),
                    'reason' => 'Initial status'
                ]
            ],
            round: 1,
            sentAt: null,
            respondedAt: null,
            responseType: null,
            responseNotes: null,
            expiresAt: $expiresAt,
            closedAt: null,
            createdAt: $now,
            updatedAt: $now
        );

        $quote->addDomainEvent(new QuoteCreated($quote));
        
        return $quote;
    }

    /**
     * Reconstitute quote from persistence data
     */
    public static function reconstitute(
        int $id,
        string $uuid,
        int $tenantId,
        int $orderId,
        int $vendorId,
        int $productId,
        int $quantity,
        array $specifications,
        ?string $notes,
        string $status,
        ?int $initialOffer,
        ?int $latestOffer,
        string $currency,
        ?array $quoteDetails,
        ?array $history,
        ?array $statusHistory,
        int $round,
        ?DateTimeImmutable $sentAt,
        ?DateTimeImmutable $respondedAt,
        ?string $responseType,
        ?string $responseNotes,
        ?DateTimeImmutable $expiresAt,
        ?DateTimeImmutable $closedAt,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
        ?DateTimeImmutable $deletedAt = null
    ): self {
        return new self(
            id: $id,
            uuid: $uuid,
            tenantId: $tenantId,
            orderId: $orderId,
            vendorId: $vendorId,
            productId: $productId,
            quantity: $quantity,
            specifications: $specifications,
            notes: $notes,
            status: QuoteStatus::from($status),
            initialOffer: $initialOffer,
            latestOffer: $latestOffer,
            currency: $currency,
            quoteDetails: $quoteDetails ?? [],
            history: $history ?? [],
            statusHistory: $statusHistory ?? [],
            round: $round,
            sentAt: $sentAt,
            respondedAt: $respondedAt,
            responseType: $responseType,
            responseNotes: $responseNotes,
            expiresAt: $expiresAt,
            closedAt: $closedAt,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
            deletedAt: $deletedAt
        );
    }

    /**
     * Update quote status with history tracking
     * 
     * @param QuoteStatus $newStatus The target status
     * @param int|null $userId User making the change
     * @param string|null $reason Reason for status change
     * @throws InvalidStatusTransitionException If transition is not allowed
     * @throws QuoteExpiredException If quote is expired
     */
    public function updateStatus(
        QuoteStatus $newStatus,
        ?int $userId = null,
        ?string $reason = null
    ): void {
        $this->guardAgainstExpired();
        
        if (!$this->status->canTransitionTo($newStatus)) {
            throw new InvalidStatusTransitionException(
                "Cannot transition from {$this->status->value} to {$newStatus->value}"
            );
        }

        $oldStatus = $this->status;
        $this->status = $newStatus;
        
        // Append to status history
        $this->statusHistory[] = [
            'from' => $oldStatus->value,
            'to' => $newStatus->value,
            'changed_by' => $userId,
            'changed_at' => (new DateTimeImmutable())->format('c'),
            'reason' => $reason
        ];
        
        $this->updatedAt = new DateTimeImmutable();
        
        $this->addDomainEvent(new QuoteStatusChanged($this, $oldStatus, $newStatus));
    }

    /**
     * Mark quote as sent to vendor
     * 
     * @throws InvalidStatusTransitionException If not in draft status
     * @throws QuoteExpiredException If quote is expired
     */
    public function markAsSent(?int $userId = null): void
    {
        $this->guardAgainstExpired();
        
        if (!$this->status->canTransitionTo(QuoteStatus::SENT)) {
            throw new InvalidStatusTransitionException(
                "Cannot mark quote as sent from {$this->status->value} status"
            );
        }

        $oldStatus = $this->status;
        $this->status = QuoteStatus::SENT;
        $this->sentAt = new DateTimeImmutable();
        
        // Append to status history
        $this->statusHistory[] = [
            'from' => $oldStatus->value,
            'to' => QuoteStatus::SENT->value,
            'changed_by' => $userId,
            'changed_at' => $this->sentAt->format('c'),
            'reason' => 'Quote sent to vendor'
        ];
        
        $this->updatedAt = new DateTimeImmutable();
        
        $this->addDomainEvent(new QuoteSentToVendor($this));
    }

    /**
     * Record vendor response to quote
     * 
     * @param string $responseType One of: 'accept', 'reject', 'counter'
     * @param string|null $notes Response notes from vendor
     * @param int|null $counterOffer Counter offer amount (for counter response)
     * @param int|null $userId Vendor user ID
     * @throws InvalidArgumentException If response type is invalid
     * @throws QuoteExpiredException If quote is expired
     */
    public function recordVendorResponse(
        string $responseType,
        ?string $notes = null,
        ?int $counterOffer = null,
        ?int $userId = null
    ): void {
        $this->guardAgainstExpired();
        
        $newStatus = match($responseType) {
            'accept' => QuoteStatus::ACCEPTED,
            'reject' => QuoteStatus::REJECTED,
            'counter' => QuoteStatus::COUNTERED,
            default => throw new InvalidArgumentException("Invalid response type: {$responseType}")
        };
        
        if (!$this->status->canTransitionTo($newStatus)) {
            throw new InvalidStatusTransitionException(
                "Cannot record {$responseType} response from {$this->status->value} status"
            );
        }

        $oldStatus = $this->status;
        $this->status = $newStatus;
        $this->responseType = $responseType;
        $this->responseNotes = $notes;
        $this->respondedAt = new DateTimeImmutable();
        
        // Update offer if counter
        if ($responseType === 'counter' && $counterOffer !== null) {
            $this->latestOffer = $counterOffer;
            $this->round++;
        }
        
        // Close quote if accepted or rejected
        if (in_array($responseType, ['accept', 'reject'])) {
            $this->closedAt = new DateTimeImmutable();
        }
        
        // Append to status history
        $this->statusHistory[] = [
            'from' => $oldStatus->value,
            'to' => $newStatus->value,
            'changed_by' => $userId,
            'changed_at' => $this->respondedAt->format('c'),
            'reason' => "Vendor {$responseType}ed quote" . ($notes ? ": {$notes}" : '')
        ];
        
        $this->updatedAt = new DateTimeImmutable();
        
        $this->addDomainEvent(new VendorRespondedToQuote($this, $responseType));
    }

    /**
     * Check if quote is expired
     */
    public function isExpired(): bool
    {
        if ($this->expiresAt === null) {
            return false;
        }
        
        return (new DateTimeImmutable()) > $this->expiresAt;
    }

    /**
     * Mark quote as expired
     * 
     * @param int|null $userId User marking as expired (system if null)
     */
    public function markAsExpired(?int $userId = null): void
    {
        if ($this->status->isTerminal()) {
            // Already in terminal state, don't change
            return;
        }

        $oldStatus = $this->status;
        $this->status = QuoteStatus::EXPIRED;
        $this->closedAt = new DateTimeImmutable();
        
        // Append to status history
        $this->statusHistory[] = [
            'from' => $oldStatus->value,
            'to' => QuoteStatus::EXPIRED->value,
            'changed_by' => $userId,
            'changed_at' => $this->closedAt->format('c'),
            'reason' => 'Quote expired without response'
        ];
        
        $this->updatedAt = new DateTimeImmutable();
        
        $this->addDomainEvent(new QuoteStatusChanged($this, $oldStatus, QuoteStatus::EXPIRED));
    }

    /**
     * Extend quote expiration date
     * 
     * @param DateTimeImmutable $newExpiresAt New expiration date
     * @param int|null $userId User extending the quote
     * @throws InvalidArgumentException If new date is in the past
     */
    public function extendExpiration(DateTimeImmutable $newExpiresAt, ?int $userId = null): void
    {
        $now = new DateTimeImmutable();
        
        if ($newExpiresAt <= $now) {
            throw new InvalidArgumentException('New expiration date must be in the future');
        }

        $this->expiresAt = $newExpiresAt;
        $this->updatedAt = $now;
        
        // Add to history
        $this->history[] = [
            'action' => 'expiration_extended',
            'user_id' => $userId,
            'timestamp' => $now->format('c'),
            'old_expires_at' => $this->expiresAt?->format('c'),
            'new_expires_at' => $newExpiresAt->format('c')
        ];
    }

    /**
     * Update quote details
     * 
     * @param array $quoteDetails New quote details
     * @param int|null $userId User making the update
     * @throws QuoteExpiredException If quote is expired
     */
    public function updateQuoteDetails(array $quoteDetails, ?int $userId = null): void
    {
        $this->guardAgainstExpired();
        
        if ($this->status->isTerminal()) {
            throw new InvalidStatusTransitionException(
                'Cannot update quote details in terminal status'
            );
        }

        $this->quoteDetails = $quoteDetails;
        $this->updatedAt = new DateTimeImmutable();
        
        // Add to history
        $this->history[] = [
            'action' => 'details_updated',
            'user_id' => $userId,
            'timestamp' => $this->updatedAt->format('c')
        ];
    }

    /**
     * Update offer amount
     * 
     * @param int $offerAmount New offer amount in cents
     * @param int|null $userId User making the update
     * @throws QuoteExpiredException If quote is expired
     */
    public function updateOffer(int $offerAmount, ?int $userId = null): void
    {
        $this->guardAgainstExpired();
        
        if ($this->status->isTerminal()) {
            throw new InvalidStatusTransitionException(
                'Cannot update offer in terminal status'
            );
        }

        $this->latestOffer = $offerAmount;
        $this->updatedAt = new DateTimeImmutable();
        
        // Add to history
        $this->history[] = [
            'action' => 'offer_updated',
            'user_id' => $userId,
            'timestamp' => $this->updatedAt->format('c'),
            'amount' => $offerAmount,
            'currency' => $this->currency
        ];
    }

    /**
     * Check if quote can be modified
     */
    public function canBeModified(): bool
    {
        return !$this->status->isTerminal() && !$this->isExpired();
    }

    /**
     * Check if quote requires vendor action
     */
    public function requiresVendorAction(): bool
    {
        return $this->status->requiresVendorAction() && !$this->isExpired();
    }

    /**
     * Check if quote requires admin action
     */
    public function requiresAdminAction(): bool
    {
        return $this->status->requiresAdminAction() && !$this->isExpired();
    }

    /**
     * Accept quote (vendor action)
     * Requirements: 6.2, 6.3, 6.4
     * 
     * @param int $estimatedDeliveryDays Estimated delivery time
     * @param string|null $notes Optional acceptance notes
     * @param int|null $userId Vendor user ID
     */
    public function accept(int $estimatedDeliveryDays, ?string $notes = null, ?int $userId = null): void
    {
        if ($estimatedDeliveryDays <= 0) {
            throw new InvalidArgumentException('Estimated delivery days must be positive');
        }

        $acceptanceNotes = $notes ?? "Estimated delivery: {$estimatedDeliveryDays} days";
        
        // Store delivery estimate in quote details
        $this->quoteDetails['estimated_delivery_days'] = $estimatedDeliveryDays;
        $this->quoteDetails['acceptance_notes'] = $notes;
        
        $this->recordVendorResponse('accept', $acceptanceNotes, null, $userId);
    }

    /**
     * Reject quote (vendor action)
     * Requirements: 6.5, 6.6, 6.7
     * 
     * @param string $rejectionReason Reason for rejection
     * @param int|null $userId Vendor user ID
     */
    public function reject(string $rejectionReason, ?int $userId = null): void
    {
        if (empty(trim($rejectionReason))) {
            throw new InvalidArgumentException('Rejection reason is required');
        }

        // Store rejection reason in quote details
        $this->quoteDetails['rejection_reason'] = $rejectionReason;
        
        $this->recordVendorResponse('reject', $rejectionReason, null, $userId);
    }

    /**
     * Counter offer (vendor action)
     * Requirements: 6.8, 6.9, 6.10
     * 
     * @param int $counterOfferAmount Counter offer amount in cents
     * @param string|null $notes Optional counter offer notes
     * @param int|null $userId Vendor user ID
     */
    public function counterOffer(int $counterOfferAmount, ?string $notes = null, ?int $userId = null): void
    {
        if ($counterOfferAmount <= 0) {
            throw new InvalidArgumentException('Counter offer amount must be positive');
        }

        // Store counter offer details
        $this->quoteDetails['counter_offer_amount'] = $counterOfferAmount;
        $this->quoteDetails['counter_offer_notes'] = $notes;
        
        $counterNotes = $notes ?? "Counter offer: {$counterOfferAmount} {$this->currency}";
        
        $this->recordVendorResponse('counter', $counterNotes, $counterOfferAmount, $userId);
    }

    /**
     * Admin counter offer (admin action)
     * 
     * @param array $adminCounterOffer Admin counter offer data with items
     * @param string|null $notes Optional admin counter offer notes
     * @param int|null $userId Admin user ID
     * @throws InvalidStatusTransitionException If not in countered status
     * @throws QuoteExpiredException If quote is expired
     */
    public function adminCounterOffer(array $adminCounterOffer, ?string $notes = null, ?int $userId = null): void
    {
        $this->guardAgainstExpired();
        
        if (!$this->status->canTransitionTo(QuoteStatus::ADMIN_COUNTERED)) {
            throw new InvalidStatusTransitionException(
                "Cannot admin counter from {$this->status->value} status"
            );
        }

        // Validate admin counter offer structure
        if (!isset($adminCounterOffer['items']) || !is_array($adminCounterOffer['items'])) {
            throw new InvalidArgumentException('Admin counter offer must contain items array');
        }

        if (!isset($adminCounterOffer['total_counter']) || $adminCounterOffer['total_counter'] <= 0) {
            throw new InvalidArgumentException('Admin counter offer total must be positive');
        }

        $oldStatus = $this->status;
        $this->status = QuoteStatus::ADMIN_COUNTERED;
        $this->updatedAt = new DateTimeImmutable();
        
        // Update latest offer to admin's counter
        $this->latestOffer = $adminCounterOffer['total_counter'];
        
        // Increment round
        $this->round++;
        
        // Store admin counter offer in quote_details
        $this->quoteDetails['admin_counter_offer'] = $adminCounterOffer;
        $this->quoteDetails['admin_counter_notes'] = $notes;
        
        // Add to negotiation history
        if (!isset($this->quoteDetails['negotiation_history'])) {
            $this->quoteDetails['negotiation_history'] = [];
        }
        
        $this->quoteDetails['negotiation_history'][] = [
            'round' => $this->round,
            'type' => 'admin_counter',
            'offer' => $adminCounterOffer,
            'notes' => $notes,
            'timestamp' => $this->updatedAt->format('c'),
            'user_id' => $userId
        ];
        
        // Append to status history
        $this->statusHistory[] = [
            'from' => $oldStatus->value,
            'to' => QuoteStatus::ADMIN_COUNTERED->value,
            'changed_by' => $userId,
            'changed_at' => $this->updatedAt->format('c'),
            'reason' => 'Admin countered vendor offer' . ($notes ? ": {$notes}" : '')
        ];
        
        // Add domain event
        $this->addDomainEvent(new \App\Domain\Quote\Events\AdminCounteredQuoteEvent($this));
    }

    /**
     * Send quote to vendor
     * Requirements: 6.1
     * 
     * @param int|null $userId Admin user ID
     */
    public function send(?int $userId = null): void
    {
        $this->markAsSent($userId);
    }

    /**
     * Expire quote
     * Requirements: 10.1, 10.2
     * 
     * @param int|null $userId User marking as expired (system if null)
     */
    public function expire(?int $userId = null): void
    {
        $this->markAsExpired($userId);
    }

    /**
     * Check if vendor can respond to this quote
     * Requirements: 6.13, 6.14
     */
    public function canRespond(): bool
    {
        // Allow response if:
        // 1. Status is SENT, PENDING_RESPONSE, or ADMIN_COUNTERED (two-way negotiation)
        // 2. Quote is not expired
        // 3. Either:
        //    a. Never responded (respondedAt is null), OR
        //    b. Has rejection history and not reached max rejections (for re-negotiation), OR
        //    c. Status is ADMIN_COUNTERED (admin has countered, vendor can respond)
        
        $isRespondableStatus = in_array($this->status, [
            QuoteStatus::SENT,
            QuoteStatus::PENDING_RESPONSE,
            QuoteStatus::ADMIN_COUNTERED  // Allow vendor to counter back after admin counter
        ]);
        $notExpired = !$this->isExpired();
        
        // Check if vendor can resubmit after rejection
        $canResubmitAfterRejection = false;
        if ($this->respondedAt !== null) {
            // Check rejection history in quote_details
            $quoteDetails = $this->quoteDetails ?? [];
            $rejectionHistory = $quoteDetails['rejection_history'] ?? [];
            $rejectionCount = count($rejectionHistory);
            
            // Allow resubmit if rejected but not reached max (2) rejections
            $canResubmitAfterRejection = $rejectionCount > 0 && $rejectionCount < 2;
        }
        
        // Allow response if:
        // - Never responded yet, OR
        // - Can resubmit after rejection, OR
        // - Admin has countered (two-way negotiation)
        $canRespond = $this->respondedAt === null 
            || $canResubmitAfterRejection 
            || $this->status === QuoteStatus::ADMIN_COUNTERED;
        
        return $isRespondableStatus && $notExpired && $canRespond;
    }
    
    /**
     * Check if vendor can submit counter offer
     * Separate from canRespond() to allow accept/reject at max rounds
     */
    public function canCounter(): bool
    {
        // Can counter if can respond AND not at max rounds
        if (!$this->canRespond()) {
            return false;
        }
        
        // Check max negotiation rounds - vendor can counter only if below max
        $quoteDetails = $this->quoteDetails ?? [];
        $maxRounds = $quoteDetails['max_rounds'] ?? 5;
        
        return $this->round < $maxRounds;
    }

    /**
     * Get quote number for display
     */
    public function getQuoteNumber(): string
    {
        // Format: QT-{year}{month}-{id}
        // Example: QT-202602-00123
        if ($this->id === null) {
            return 'QT-DRAFT';
        }
        
        return sprintf(
            'QT-%s-%05d',
            $this->createdAt->format('Ym'),
            $this->id
        );
    }

    // Getters
    public function getId(): ?int { return $this->id; }
    public function getUuid(): string { return $this->uuid; }
    public function getTenantId(): int { return $this->tenantId; }
    public function getOrderId(): int { return $this->orderId; }
    public function getVendorId(): int { return $this->vendorId; }
    public function getProductId(): int { return $this->productId; }
    public function getQuantity(): int { return $this->quantity; }
    public function getSpecifications(): array { return $this->specifications; }
    public function getNotes(): ?string { return $this->notes; }
    public function getStatus(): QuoteStatus { return $this->status; }
    public function getInitialOffer(): ?int { return $this->initialOffer; }
    public function getLatestOffer(): ?int { return $this->latestOffer; }
    public function getCurrency(): string { return $this->currency; }
    public function getQuoteDetails(): ?array { return $this->quoteDetails; }
    public function getHistory(): array { return $this->history; }
    public function getStatusHistory(): array { return $this->statusHistory; }
    public function getRound(): int { return $this->round; }
    public function getSentAt(): ?DateTimeImmutable { return $this->sentAt; }
    public function getRespondedAt(): ?DateTimeImmutable { return $this->respondedAt; }
    public function getResponseType(): ?string { return $this->responseType; }
    public function getResponseNotes(): ?string { return $this->responseNotes; }
    public function getExpiresAt(): ?DateTimeImmutable { return $this->expiresAt; }
    public function getClosedAt(): ?DateTimeImmutable { return $this->closedAt; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): DateTimeImmutable { return $this->updatedAt; }
    public function getDeletedAt(): ?DateTimeImmutable { return $this->deletedAt; }

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

    /**
     * Guard against expired quote
     */
    private function guardAgainstExpired(): void
    {
        if ($this->isExpired() && !$this->status->isTerminal()) {
            throw new QuoteExpiredException('Quote has expired and cannot be modified');
        }
    }
}
