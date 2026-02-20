<?php

namespace App\Application\CustomerQuote\Services;

use App\Domain\CustomerQuote\Services\NegotiationRoundValidator;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Application Service for Quote Negotiation Management
 * 
 * Handles negotiation rounds between customer and admin:
 * - Customer counter offers
 * - Admin responses to counter offers
 * - Negotiation round validation
 * - History tracking
 */
class NegotiationService
{
    public function __construct(
        private NegotiationRoundValidator $roundValidator,
        private CustomerNotificationService $notificationService,
        private CustomerQuoteMonitoringService $monitoringService
    ) {}

    /**
     * Submit customer counter offer
     */
    public function submitCounterOffer(
        string $quoteUuid,
        int $customerId,
        int $counterAmount,
        string $reason,
        ?string $additionalRequests = null
    ): CustomerQuote {
        if (strlen($reason) < 20) {
            throw new \InvalidArgumentException('Counter offer reason must be at least 20 characters');
        }

        if ($counterAmount <= 0) {
            throw new \InvalidArgumentException('Counter amount must be positive');
        }

        return DB::transaction(function () use (
            $quoteUuid,
            $customerId,
            $counterAmount,
            $reason,
            $additionalRequests
        ) {
            $quote = CustomerQuote::where('uuid', $quoteUuid)->firstOrFail();

            // Validate quote can be countered
            if (!$quote->canBeCountered()) {
                throw new \DomainException('Quote cannot be countered in current state or max rounds reached');
            }

            // Update quote
            $quote->update([
                'status' => 'countered',
                'counter_offer_amount' => $counterAmount,
                'counter_offer_notes' => $reason,
                'counter_offer_additional_requests' => $additionalRequests,
                'counter_offer_round' => $quote->counter_offer_round + 1,
                'countered_at' => now(),
                'countered_by' => $customerId,
                'responded_at' => now(), // Set responded_at timestamp
            ]);

            // Add history using model method
            $quote->addHistoryEntry([
                'action' => 'customer_counter_offer',
                'actor_type' => 'customer',
                'actor_id' => $customerId,
                'timestamp' => now()->toIso8601String(),
                'details' => [
                    'round' => $quote->counter_offer_round,
                    'original_amount' => $quote->grand_total,
                    'counter_amount' => $counterAmount,
                    'difference' => $quote->grand_total - $counterAmount,
                    'difference_percentage' => (($quote->grand_total - $counterAmount) / $quote->grand_total) * 100,
                    'reason' => $reason,
                    'additional_requests' => $additionalRequests,
                ],
            ]);

            // Log monitoring
            $this->monitoringService->logNegotiationRound(
                $quote->id,
                $quote->counter_offer_round,
                'customer',
                $quote->grand_total,
                $counterAmount,
                [
                    'customer_id' => $customerId,
                    'reason' => $reason,
                    'additional_requests' => $additionalRequests,
                ]
            );

            // TODO: Notify admin
            // dispatch(new NotifyAdminCounterOfferJob($quote));

            return $quote->fresh();
        });
    }

    /**
     * Admin accepts customer counter offer
     */
    public function acceptCounterOffer(
        string $quoteUuid,
        int $adminId,
        ?string $notes = null
    ): CustomerQuote {
        return DB::transaction(function () use ($quoteUuid, $adminId, $notes) {
            $quote = CustomerQuote::where('uuid', $quoteUuid)->firstOrFail();

            if ($quote->status !== 'countered') {
                throw new \DomainException('Only countered quotes can be accepted');
            }

            // Update quote with counter offer amount
            $quote->update([
                'status' => 'accepted',
                'grand_total' => $quote->counter_offer_amount,
                'approved_at' => now(),
                'approved_by' => $adminId,
                'approval_notes' => $notes,
                'approval_method' => 'manual',
            ]);

            // Update order status
            $quote->order->update([
                'status' => 'awaiting_payment',
                'payment_due_date' => now()->addDays(3),
            ]);

            // Add history using model method
            $quote->addHistoryEntry([
                'action' => 'admin_accepted_counter_offer',
                'actor_type' => 'admin',
                'actor_id' => $adminId,
                'timestamp' => now()->toIso8601String(),
                'details' => [
                    'accepted_amount' => $quote->counter_offer_amount,
                    'original_amount' => $quote->grand_total,
                    'notes' => $notes,
                ],
            ]);

            // Create notification for customer
            $this->notificationService->notifyCounterOfferAccepted($quote);

            // TODO: Notify customer with payment instructions
            // dispatch(new SendPaymentInstructionsJob($quote));

            return $quote->fresh();
        });
    }

    /**
     * Admin rejects customer counter offer
     */
    public function rejectCounterOffer(
        string $quoteUuid,
        int $adminId,
        string $reason
    ): CustomerQuote {
        if (strlen($reason) < 20) {
            throw new \InvalidArgumentException('Rejection reason must be at least 20 characters');
        }

        return DB::transaction(function () use ($quoteUuid, $adminId, $reason) {
            $quote = CustomerQuote::where('uuid', $quoteUuid)->firstOrFail();

            if ($quote->status !== 'countered') {
                throw new \DomainException('Only countered quotes can be rejected');
            }

            $quote->update([
                'status' => 'rejected',
                'rejected_at' => now(),
                'rejected_by' => $adminId,
                'rejection_reason' => $reason,
            ]);

            // Revert order status
            $quote->order->update([
                'status' => 'customer_quote',
            ]);

            // Add history using model method
            $quote->addHistoryEntry([
                'action' => 'admin_rejected_counter_offer',
                'actor_type' => 'admin',
                'actor_id' => $adminId,
                'timestamp' => now()->toIso8601String(),
                'details' => [
                    'reason' => $reason,
                    'counter_amount' => $quote->counter_offer_amount,
                ],
            ]);

            // Create notification for customer
            $this->notificationService->notifyCounterOfferRejected($quote, $reason);

            // TODO: Notify customer
            // dispatch(new NotifyCustomerCounterRejectedJob($quote));

            return $quote->fresh();
        });
    }

    /**
     * Admin sends new counter offer to customer
     */
    public function sendAdminCounterOffer(
        string $quoteUuid,
        int $adminId,
        int $newAmount,
        string $explanation
    ): CustomerQuote {
        if (strlen($explanation) < 20) {
            throw new \InvalidArgumentException('Counter offer explanation must be at least 20 characters');
        }

        if ($newAmount <= 0) {
            throw new \InvalidArgumentException('Counter amount must be positive');
        }

        return DB::transaction(function () use ($quoteUuid, $adminId, $newAmount, $explanation) {
            $quote = CustomerQuote::where('uuid', $quoteUuid)->firstOrFail();

            if ($quote->status !== 'countered') {
                throw new \DomainException('Can only counter offer on countered quotes');
            }

            // Update quote
            $quote->update([
                'status' => 'sent',
                'grand_total' => $newAmount,
                'counter_offer_round' => $quote->counter_offer_round + 1,
                // Extend validity
                'valid_until' => Carbon::now()->addDays(7),
            ]);

            // Add history using model method
            $quote->addHistoryEntry([
                'action' => 'admin_counter_offer',
                'actor_type' => 'admin',
                'actor_id' => $adminId,
                'timestamp' => now()->toIso8601String(),
                'details' => [
                    'round' => $quote->counter_offer_round,
                    'customer_counter_amount' => $quote->counter_offer_amount,
                    'admin_counter_amount' => $newAmount,
                    'explanation' => $explanation,
                ],
            ]);

            // Create notification for customer
            $this->notificationService->notifyCounterOfferReceived($quote);

            // TODO: Notify customer with new offer
            // dispatch(new SendCounterOfferEmailJob($quote));

            return $quote->fresh();
        });
    }

    /**
     * Get negotiation history for quote
     */
    public function getNegotiationHistory(string $quoteUuid): array
    {
        $quote = CustomerQuote::where('uuid', $quoteUuid)->firstOrFail();
        
        $history = $quote->history ?? [];
        
        // Filter only negotiation-related actions
        return array_filter($history, function ($entry) {
            return in_array($entry['action'], [
                'customer_counter_offer',
                'admin_accepted_counter_offer',
                'admin_rejected_counter_offer',
                'admin_counter_offer',
            ]);
        });
    }

    /**
     * Check if customer can submit counter offer
     */
    public function canSubmitCounterOffer(CustomerQuote $quote): bool
    {
        return $quote->canBeCountered();
    }
}
