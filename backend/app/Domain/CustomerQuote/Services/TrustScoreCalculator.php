<?php

declare(strict_types=1);

namespace App\Domain\CustomerQuote\Services;

/**
 * TrustScoreCalculator Domain Service
 * 
 * Stateless domain service for calculating customer trust scores.
 * Algorithm: Email verified (20) + Order history (40) + Payment rate (40) = 100 max
 */
class TrustScoreCalculator
{
    private const EMAIL_VERIFIED_POINTS = 20;
    private const MAX_ORDER_HISTORY_POINTS = 40;
    private const MAX_PAYMENT_RATE_POINTS = 40;
    private const POINTS_PER_SUCCESSFUL_ORDER = 5;

    /**
     * Calculate customer trust score
     * 
     * Scoring breakdown:
     * - Email verified: 20 points
     * - Successful orders: 5 points each (max 40 points)
     * - Payment success rate: up to 40 points (proportional to rate)
     * 
     * Total: 0-100 points
     */
    public function calculate(
        bool $emailVerified,
        int $successfulOrders,
        float $paymentSuccessRate
    ): float {
        $score = 0.0;

        // Email verification: 20 points
        if ($emailVerified) {
            $score += self::EMAIL_VERIFIED_POINTS;
        }

        // Successful orders: 5 points each, max 40 points
        $orderPoints = min(
            $successfulOrders * self::POINTS_PER_SUCCESSFUL_ORDER,
            self::MAX_ORDER_HISTORY_POINTS
        );
        $score += $orderPoints;

        // Payment success rate: up to 40 points
        $paymentPoints = ($paymentSuccessRate / 100) * self::MAX_PAYMENT_RATE_POINTS;
        $score += $paymentPoints;

        // Ensure score is between 0 and 100
        return min(max($score, 0.0), 100.0);
    }

    /**
     * Calculate trust score from customer data
     */
    public function calculateFromCustomer(object $customer): float
    {
        $emailVerified = !is_null($customer->email_verified_at ?? null);
        $successfulOrders = $customer->successful_orders_count ?? 0;
        $paymentSuccessRate = $customer->payment_success_rate ?? 0.0;

        return $this->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);
    }

    /**
     * Get trust level category
     */
    public function getTrustLevel(float $score): string
    {
        return match(true) {
            $score >= 80 => 'excellent',
            $score >= 60 => 'good',
            $score >= 40 => 'fair',
            $score >= 20 => 'low',
            default => 'very_low',
        };
    }

    /**
     * Get trust level description
     */
    public function getTrustLevelDescription(float $score): string
    {
        return match($this->getTrustLevel($score)) {
            'excellent' => 'Highly trusted customer with excellent track record',
            'good' => 'Trusted customer with good payment history',
            'fair' => 'Moderate trust level, some history established',
            'low' => 'Limited trust, new or inconsistent customer',
            'very_low' => 'Very low trust, new customer or poor history',
        };
    }

    /**
     * Check if customer meets minimum trust threshold
     */
    public function meetsTrustThreshold(float $score, float $threshold = 40.0): bool
    {
        return $score >= $threshold;
    }

    /**
     * Get trust score breakdown
     */
    public function getScoreBreakdown(
        bool $emailVerified,
        int $successfulOrders,
        float $paymentSuccessRate
    ): array {
        $emailPoints = $emailVerified ? self::EMAIL_VERIFIED_POINTS : 0;
        
        $orderPoints = min(
            $successfulOrders * self::POINTS_PER_SUCCESSFUL_ORDER,
            self::MAX_ORDER_HISTORY_POINTS
        );
        
        $paymentPoints = ($paymentSuccessRate / 100) * self::MAX_PAYMENT_RATE_POINTS;
        
        $totalScore = $emailPoints + $orderPoints + $paymentPoints;

        return [
            'email_verified' => [
                'points' => $emailPoints,
                'max_points' => self::EMAIL_VERIFIED_POINTS,
                'status' => $emailVerified,
            ],
            'order_history' => [
                'points' => $orderPoints,
                'max_points' => self::MAX_ORDER_HISTORY_POINTS,
                'successful_orders' => $successfulOrders,
                'points_per_order' => self::POINTS_PER_SUCCESSFUL_ORDER,
            ],
            'payment_rate' => [
                'points' => $paymentPoints,
                'max_points' => self::MAX_PAYMENT_RATE_POINTS,
                'rate' => $paymentSuccessRate,
            ],
            'total_score' => min($totalScore, 100.0),
            'trust_level' => $this->getTrustLevel($totalScore),
            'trust_description' => $this->getTrustLevelDescription($totalScore),
        ];
    }

    /**
     * Calculate required improvements to reach target score
     */
    public function calculateRequiredImprovements(
        float $currentScore,
        float $targetScore,
        bool $emailVerified,
        int $successfulOrders,
        float $paymentSuccessRate
    ): array {
        if ($currentScore >= $targetScore) {
            return [
                'target_reached' => true,
                'improvements_needed' => [],
            ];
        }

        $pointsNeeded = $targetScore - $currentScore;
        $improvements = [];

        // Check if email verification would help
        if (!$emailVerified && $pointsNeeded > 0) {
            $improvements[] = [
                'action' => 'verify_email',
                'points_gained' => self::EMAIL_VERIFIED_POINTS,
                'description' => 'Verify email address',
            ];
            $pointsNeeded -= self::EMAIL_VERIFIED_POINTS;
        }

        // Calculate orders needed
        if ($pointsNeeded > 0) {
            $currentOrderPoints = min(
                $successfulOrders * self::POINTS_PER_SUCCESSFUL_ORDER,
                self::MAX_ORDER_HISTORY_POINTS
            );
            $remainingOrderPoints = self::MAX_ORDER_HISTORY_POINTS - $currentOrderPoints;
            
            if ($remainingOrderPoints > 0) {
                $ordersNeeded = (int) ceil(min($pointsNeeded, $remainingOrderPoints) / self::POINTS_PER_SUCCESSFUL_ORDER);
                $improvements[] = [
                    'action' => 'complete_orders',
                    'orders_needed' => $ordersNeeded,
                    'points_gained' => $ordersNeeded * self::POINTS_PER_SUCCESSFUL_ORDER,
                    'description' => "Complete {$ordersNeeded} successful order(s)",
                ];
                $pointsNeeded -= ($ordersNeeded * self::POINTS_PER_SUCCESSFUL_ORDER);
            }
        }

        // Calculate payment rate improvement needed
        if ($pointsNeeded > 0) {
            $currentPaymentPoints = ($paymentSuccessRate / 100) * self::MAX_PAYMENT_RATE_POINTS;
            $remainingPaymentPoints = self::MAX_PAYMENT_RATE_POINTS - $currentPaymentPoints;
            
            if ($remainingPaymentPoints > 0) {
                $rateIncrease = ($pointsNeeded / self::MAX_PAYMENT_RATE_POINTS) * 100;
                $targetRate = min($paymentSuccessRate + $rateIncrease, 100.0);
                
                $improvements[] = [
                    'action' => 'improve_payment_rate',
                    'current_rate' => $paymentSuccessRate,
                    'target_rate' => $targetRate,
                    'points_gained' => min($pointsNeeded, $remainingPaymentPoints),
                    'description' => sprintf('Improve payment success rate to %.1f%%', $targetRate),
                ];
            }
        }

        return [
            'target_reached' => false,
            'points_needed' => max($targetScore - $currentScore, 0),
            'improvements_needed' => $improvements,
        ];
    }

    /**
     * Predict future trust score
     */
    public function predictFutureScore(
        bool $emailVerified,
        int $successfulOrders,
        float $paymentSuccessRate,
        int $additionalOrders = 0,
        float $newPaymentRate = null
    ): array {
        $currentScore = $this->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);
        
        $futureSuccessfulOrders = $successfulOrders + $additionalOrders;
        $futurePaymentRate = $newPaymentRate ?? $paymentSuccessRate;
        
        $futureScore = $this->calculate($emailVerified, $futureSuccessfulOrders, $futurePaymentRate);

        return [
            'current_score' => $currentScore,
            'future_score' => $futureScore,
            'score_increase' => $futureScore - $currentScore,
            'current_level' => $this->getTrustLevel($currentScore),
            'future_level' => $this->getTrustLevel($futureScore),
            'assumptions' => [
                'additional_orders' => $additionalOrders,
                'payment_rate' => $futurePaymentRate,
            ],
        ];
    }

    /**
     * Compare two customers' trust scores
     */
    public function compareCustomers(
        array $customer1Data,
        array $customer2Data
    ): array {
        $score1 = $this->calculate(
            $customer1Data['email_verified'],
            $customer1Data['successful_orders'],
            $customer1Data['payment_success_rate']
        );

        $score2 = $this->calculate(
            $customer2Data['email_verified'],
            $customer2Data['successful_orders'],
            $customer2Data['payment_success_rate']
        );

        return [
            'customer1_score' => $score1,
            'customer2_score' => $score2,
            'difference' => abs($score1 - $score2),
            'higher_trust' => $score1 > $score2 ? 'customer1' : ($score2 > $score1 ? 'customer2' : 'equal'),
            'customer1_level' => $this->getTrustLevel($score1),
            'customer2_level' => $this->getTrustLevel($score2),
        ];
    }
}
