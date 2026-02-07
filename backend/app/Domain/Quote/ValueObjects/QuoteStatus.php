<?php

declare(strict_types=1);

namespace App\Domain\Quote\ValueObjects;

/**
 * QuoteStatus Value Object
 * 
 * Represents the lifecycle status of a quote with validation for state transitions.
 * This value object encapsulates quote status logic and provides helper methods
 * for UI display.
 * 
 * Status Flow:
 * - DRAFT: Initial state when quote is created
 * - SENT: Quote has been sent to vendor
 * - PENDING_RESPONSE: Waiting for vendor response
 * - ACCEPTED: Vendor accepted the quote
 * - REJECTED: Vendor rejected the quote
 * - COUNTERED: Vendor provided a counter offer
 * - EXPIRED: Quote expired without response
 */
enum QuoteStatus: string
{
    case DRAFT = 'draft';
    case SENT = 'sent';
    case PENDING_RESPONSE = 'pending_response';
    case ACCEPTED = 'accepted';
    case REJECTED = 'rejected';
    case COUNTERED = 'countered';
    case EXPIRED = 'expired';

    /**
     * Validate if the current status can transition to a new status.
     * 
     * Transition Rules:
     * - DRAFT → SENT (when quote is sent to vendor)
     * - SENT → PENDING_RESPONSE, ACCEPTED, REJECTED, COUNTERED, EXPIRED (vendor can respond directly)
     * - PENDING_RESPONSE → ACCEPTED, REJECTED, COUNTERED, EXPIRED (vendor response)
     * - COUNTERED → ACCEPTED, REJECTED, EXPIRED (after counter offer)
     * - Terminal states (ACCEPTED, REJECTED, EXPIRED) cannot transition
     * 
     * @param self $newStatus The target status to transition to
     * @return bool True if transition is valid, false otherwise
     */
    public function canTransitionTo(self $newStatus): bool
    {
        return match ($this) {
            self::DRAFT => in_array($newStatus, [self::SENT]),
            self::SENT => in_array($newStatus, [
                self::PENDING_RESPONSE,
                self::ACCEPTED,
                self::REJECTED,
                self::COUNTERED,
                self::EXPIRED
            ]),
            self::PENDING_RESPONSE => in_array($newStatus, [
                self::ACCEPTED,
                self::REJECTED,
                self::COUNTERED,
                self::EXPIRED
            ]),
            self::COUNTERED => in_array($newStatus, [
                self::ACCEPTED,
                self::REJECTED,
                self::EXPIRED
            ]),
            // Terminal states cannot transition
            self::ACCEPTED, self::REJECTED, self::EXPIRED => false,
        };
    }

    /**
     * Get human-readable label for the status.
     * 
     * @return string Display label for UI
     */
    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::SENT => 'Sent to Vendor',
            self::PENDING_RESPONSE => 'Awaiting Response',
            self::ACCEPTED => 'Accepted',
            self::REJECTED => 'Rejected',
            self::COUNTERED => 'Counter Offer',
            self::EXPIRED => 'Expired',
        };
    }

    /**
     * Get color code for status display in UI.
     * 
     * Colors follow semantic meaning:
     * - gray: Inactive/neutral states (draft, expired)
     * - blue: In progress (sent)
     * - yellow: Awaiting action (pending_response)
     * - green: Success (accepted)
     * - red: Failure (rejected)
     * - orange: Negotiation (countered)
     * 
     * @return string Color name for UI styling
     */
    public function color(): string
    {
        return match ($this) {
            self::DRAFT => 'gray',
            self::SENT => 'blue',
            self::PENDING_RESPONSE => 'yellow',
            self::ACCEPTED => 'green',
            self::REJECTED => 'red',
            self::COUNTERED => 'orange',
            self::EXPIRED => 'gray',
        };
    }

    /**
     * Check if the status is a terminal state.
     * Terminal states cannot transition to other states.
     * 
     * @return bool True if status is terminal
     */
    public function isTerminal(): bool
    {
        return in_array($this, [self::ACCEPTED, self::REJECTED, self::EXPIRED]);
    }

    /**
     * Check if the status requires vendor action.
     * 
     * @return bool True if vendor needs to respond
     */
    public function requiresVendorAction(): bool
    {
        return in_array($this, [self::SENT, self::PENDING_RESPONSE, self::COUNTERED]);
    }

    /**
     * Check if the status requires admin action.
     * 
     * @return bool True if admin needs to take action
     */
    public function requiresAdminAction(): bool
    {
        return $this === self::COUNTERED;
    }

    /**
     * Get all possible next statuses from the current status.
     * 
     * @return array<self> Array of valid next statuses
     */
    public function possibleTransitions(): array
    {
        return match ($this) {
            self::DRAFT => [self::SENT],
            self::SENT => [
                self::PENDING_RESPONSE,
                self::ACCEPTED,
                self::REJECTED,
                self::COUNTERED,
                self::EXPIRED
            ],
            self::PENDING_RESPONSE => [
                self::ACCEPTED,
                self::REJECTED,
                self::COUNTERED,
                self::EXPIRED
            ],
            self::COUNTERED => [
                self::ACCEPTED,
                self::REJECTED,
                self::EXPIRED
            ],
            self::ACCEPTED, self::REJECTED, self::EXPIRED => [],
        };
    }
}
