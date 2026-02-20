<?php

declare(strict_types=1);

namespace App\Domain\CustomerQuote\Services;

use App\Domain\CustomerQuote\Entities\CustomerQuote;

/**
 * NegotiationRoundValidator Domain Service
 * 
 * Stateless domain service for validating negotiation rounds and status.
 */
class NegotiationRoundValidator
{
    /**
     * Check if negotiation is allowed
     */
    public function canNegotiate(CustomerQuote $quote): bool
    {
        // Check if quote is in negotiable status
        if (!$this->isNegotiableStatus($quote->getStatus())) {
            return false;
        }

        // Check if max rounds reached
        if ($this->hasReachedMaxRounds($quote)) {
            return false;
        }

        // Check if quote is expired
        if ($quote->isExpired()) {
            return false;
        }

        return true;
    }

    /**
     * Check if status allows negotiation
     */
    public function isNegotiableStatus(string $status): bool
    {
        return in_array($status, ['sent', 'viewed', 'countered']);
    }

    /**
     * Check if max negotiation rounds reached
     */
    public function hasReachedMaxRounds(CustomerQuote $quote): bool
    {
        return $quote->getCounterOfferRound() >= $quote->getMaxNegotiationRounds();
    }

    /**
     * Get remaining negotiation rounds
     */
    public function getRemainingRounds(CustomerQuote $quote): int
    {
        return max(0, $quote->getMaxNegotiationRounds() - $quote->getCounterOfferRound());
    }

    /**
     * Check if this is the final negotiation round
     */
    public function isFinalRound(CustomerQuote $quote): bool
    {
        return $this->getRemainingRounds($quote) === 1;
    }

    /**
     * Validate counter offer amount
     */
    public function validateCounterOfferAmount(
        CustomerQuote $quote,
        int $counterAmount
    ): array {
        $errors = [];

        // Check if amount is positive
        if ($counterAmount <= 0) {
            $errors[] = 'Counter offer amount must be positive';
        }

        // Check if amount is reasonable (not too low)
        $vendorCost = $quote->getVendorTotalCost();
        if ($counterAmount < $vendorCost) {
            $errors[] = 'Counter offer amount is below vendor cost';
        }

        // Check if amount is significantly different from current
        $currentAmount = $quote->getGrandTotal();
        $difference = abs($currentAmount - $counterAmount);
        $percentageDifference = ($difference / $currentAmount) * 100;

        if ($percentageDifference < 1) {
            $errors[] = 'Counter offer amount is too close to current amount (less than 1% difference)';
        }

        // Check if amount is reasonable (not too high - more than 200% of current)
        if ($counterAmount > ($currentAmount * 2)) {
            $errors[] = 'Counter offer amount is unreasonably high (more than 200% of current amount)';
        }

        return $errors;
    }

    /**
     * Get negotiation status
     */
    public function getNegotiationStatus(CustomerQuote $quote): string
    {
        if (!$this->canNegotiate($quote)) {
            if ($this->hasReachedMaxRounds($quote)) {
                return 'max_rounds_reached';
            }
            if ($quote->isExpired()) {
                return 'expired';
            }
            if (!$this->isNegotiableStatus($quote->getStatus())) {
                return 'not_negotiable';
            }
        }

        if ($quote->getCounterOfferRound() === 0) {
            return 'no_negotiation';
        }

        if ($this->isFinalRound($quote)) {
            return 'final_round';
        }

        return 'in_progress';
    }

    /**
     * Get negotiation status description
     */
    public function getNegotiationStatusDescription(CustomerQuote $quote): string
    {
        $status = $this->getNegotiationStatus($quote);

        return match($status) {
            'max_rounds_reached' => 'Maximum negotiation rounds reached',
            'expired' => 'Quote has expired, negotiation not allowed',
            'not_negotiable' => 'Quote status does not allow negotiation',
            'no_negotiation' => 'No negotiation has occurred yet',
            'final_round' => 'This is the final negotiation round',
            'in_progress' => 'Negotiation in progress',
        };
    }

    /**
     * Get negotiation details
     */
    public function getNegotiationDetails(CustomerQuote $quote): array
    {
        return [
            'can_negotiate' => $this->canNegotiate($quote),
            'current_round' => $quote->getCounterOfferRound(),
            'max_rounds' => $quote->getMaxNegotiationRounds(),
            'remaining_rounds' => $this->getRemainingRounds($quote),
            'is_final_round' => $this->isFinalRound($quote),
            'has_reached_max' => $this->hasReachedMaxRounds($quote),
            'status' => $this->getNegotiationStatus($quote),
            'description' => $this->getNegotiationStatusDescription($quote),
            'is_negotiable_status' => $this->isNegotiableStatus($quote->getStatus()),
        ];
    }

    /**
     * Validate negotiation action
     */
    public function validateNegotiationAction(
        CustomerQuote $quote,
        string $action,
        ?int $newAmount = null
    ): array {
        $errors = [];

        // Check if negotiation is allowed
        if (!$this->canNegotiate($quote)) {
            $errors[] = $this->getNegotiationStatusDescription($quote);
            return $errors;
        }

        // Validate based on action
        switch ($action) {
            case 'counter':
                if ($newAmount === null) {
                    $errors[] = 'Counter offer amount is required';
                } else {
                    $errors = array_merge($errors, $this->validateCounterOfferAmount($quote, $newAmount));
                }
                break;

            case 'accept':
                // No additional validation needed
                break;

            case 'reject':
                // No additional validation needed
                break;

            default:
                $errors[] = "Invalid negotiation action: {$action}";
        }

        return $errors;
    }

    /**
     * Calculate negotiation progress percentage
     */
    public function getNegotiationProgress(CustomerQuote $quote): float
    {
        if ($quote->getMaxNegotiationRounds() === 0) {
            return 0.0;
        }

        return ($quote->getCounterOfferRound() / $quote->getMaxNegotiationRounds()) * 100;
    }

    /**
     * Get negotiation history summary
     */
    public function getNegotiationHistorySummary(CustomerQuote $quote): array
    {
        $history = $quote->getHistory();
        $negotiationEvents = array_filter($history, function($entry) {
            return in_array($entry['action'] ?? '', [
                'customer_counter_offer',
                'admin_counter_offer',
                'counter_offer_accepted',
                'counter_offer_rejected',
            ]);
        });

        $summary = [
            'total_rounds' => $quote->getCounterOfferRound(),
            'customer_counters' => 0,
            'admin_counters' => 0,
            'events' => [],
        ];

        foreach ($negotiationEvents as $event) {
            $action = $event['action'] ?? '';
            
            if ($action === 'customer_counter_offer') {
                $summary['customer_counters']++;
            } elseif ($action === 'admin_counter_offer') {
                $summary['admin_counters']++;
            }

            $summary['events'][] = [
                'action' => $action,
                'timestamp' => $event['timestamp'] ?? null,
                'actor_type' => $event['actor_type'] ?? null,
                'old_value' => $event['old_value'] ?? null,
                'new_value' => $event['new_value'] ?? null,
                'notes' => $event['notes'] ?? null,
            ];
        }

        return $summary;
    }

    /**
     * Recommend negotiation strategy
     */
    public function recommendStrategy(CustomerQuote $quote): string
    {
        $remainingRounds = $this->getRemainingRounds($quote);
        $currentRound = $quote->getCounterOfferRound();

        if ($remainingRounds === 0) {
            return 'accept_or_reject';
        }

        if ($remainingRounds === 1) {
            return 'final_offer';
        }

        if ($currentRound === 0) {
            return 'initial_response';
        }

        return 'continue_negotiation';
    }

    /**
     * Get recommended action message
     */
    public function getRecommendedActionMessage(CustomerQuote $quote): string
    {
        $strategy = $this->recommendStrategy($quote);

        return match($strategy) {
            'accept_or_reject' => 'Maximum rounds reached. Accept or reject the current offer.',
            'final_offer' => 'This is your final negotiation round. Make your best offer.',
            'initial_response' => 'Review the quote and decide whether to accept, reject, or counter.',
            'continue_negotiation' => 'Continue negotiating to reach a mutually acceptable price.',
        };
    }
}
