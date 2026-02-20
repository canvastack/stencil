<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\CustomerQuote\Services;

use App\Domain\CustomerQuote\Services\TrustScoreCalculator;
use Tests\TestCase;

/**
 * Property-Based Test: Trust Score Calculations Are Deterministic
 * 
 * **Feature: customer-quote-workflow, Property 4: Trust Score Calculations Are Deterministic**
 * **Validates: Requirements 5.5**
 * 
 * For any customer data, the trust score calculation should:
 * 1. Be deterministic (same inputs always produce same score)
 * 2. Always be within valid range (0-100)
 * 3. Follow the defined algorithm consistently
 * 4. Handle edge cases correctly
 * 5. Be monotonic (better metrics = higher score)
 * 
 * This property test verifies trust score calculation integrity.
 */
class TrustScorePropertyTest extends TestCase
{
    private TrustScoreCalculator $calculator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calculator = new TrustScoreCalculator();
    }

    /**
     * Property: Trust score is deterministic
     * 
     * @test
     */
    public function property_trust_score_is_deterministic(): void
    {
        // Run 100 iterations with random customer data
        for ($i = 0; $i < 100; $i++) {
            $emailVerified = (bool) rand(0, 1);
            $successfulOrders = rand(0, 20);
            $paymentSuccessRate = rand(0, 100) + (rand(0, 99) / 100);

            // Calculate twice with same inputs
            $score1 = $this->calculator->calculate(
                $emailVerified,
                $successfulOrders,
                $paymentSuccessRate
            );

            $score2 = $this->calculator->calculate(
                $emailVerified,
                $successfulOrders,
                $paymentSuccessRate
            );

            // Scores must be identical
            $this->assertEquals(
                $score1,
                $score2,
                "Trust score must be deterministic for same inputs"
            );
        }
    }

    /**
     * Property: Trust score is always within valid range (0-100)
     * 
     * @test
     */
    public function property_trust_score_within_valid_range(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $emailVerified = (bool) rand(0, 1);
            $successfulOrders = rand(0, 100);
            $paymentSuccessRate = rand(0, 100) + (rand(0, 99) / 100);

            $score = $this->calculator->calculate(
                $emailVerified,
                $successfulOrders,
                $paymentSuccessRate
            );

            // Score must be between 0 and 100
            $this->assertGreaterThanOrEqual(
                0.0,
                $score,
                "Trust score must be >= 0"
            );

            $this->assertLessThanOrEqual(
                100.0,
                $score,
                "Trust score must be <= 100"
            );
        }
    }

    /**
     * Property: Email verification adds exactly 20 points
     * 
     * @test
     */
    public function property_email_verification_adds_20_points(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $successfulOrders = rand(0, 20);
            $paymentSuccessRate = rand(0, 100) + (rand(0, 99) / 100);

            $scoreWithoutEmail = $this->calculator->calculate(
                false,
                $successfulOrders,
                $paymentSuccessRate
            );

            $scoreWithEmail = $this->calculator->calculate(
                true,
                $successfulOrders,
                $paymentSuccessRate
            );

            // Difference should be exactly 20 points (with floating point tolerance)
            $difference = $scoreWithEmail - $scoreWithoutEmail;
            $this->assertEqualsWithDelta(
                20.0,
                $difference,
                0.5, // Allow larger tolerance due to payment rate calculations
                "Email verification should add exactly 20 points"
            );
        }
    }

    /**
     * Property: More successful orders increase score (up to maximum)
     * 
     * @test
     */
    public function property_more_orders_increase_score(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $emailVerified = (bool) rand(0, 1);
            $paymentSuccessRate = rand(0, 100) + (rand(0, 99) / 100);

            // Test with increasing order counts
            $orders1 = rand(0, 5);
            $orders2 = $orders1 + rand(1, 5);

            $score1 = $this->calculator->calculate(
                $emailVerified,
                $orders1,
                $paymentSuccessRate
            );

            $score2 = $this->calculator->calculate(
                $emailVerified,
                $orders2,
                $paymentSuccessRate
            );

            // More orders should give higher or equal score (capped at 40 points)
            $this->assertGreaterThanOrEqual(
                $score1,
                $score2,
                "More successful orders should increase or maintain trust score"
            );
        }
    }

    /**
     * Property: Order history points capped at 40
     * 
     * @test
     */
    public function property_order_history_points_capped_at_40(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $emailVerified = (bool) rand(0, 1);
            $paymentSuccessRate = rand(0, 100) + (rand(0, 99) / 100);

            // Test with 8 orders (should give 40 points)
            $score8Orders = $this->calculator->calculate(
                $emailVerified,
                8,
                $paymentSuccessRate
            );

            // Test with more orders (should still give 40 points max)
            $scoreMoreOrders = $this->calculator->calculate(
                $emailVerified,
                rand(9, 50),
                $paymentSuccessRate
            );

            // Scores should be equal (order points capped)
            $this->assertEquals(
                $score8Orders,
                $scoreMoreOrders,
                "Order history points should be capped at 40 (8 orders × 5 points)"
            );
        }
    }

    /**
     * Property: Higher payment success rate increases score
     * 
     * @test
     */
    public function property_higher_payment_rate_increases_score(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $emailVerified = (bool) rand(0, 1);
            $successfulOrders = rand(0, 20);

            $rate1 = rand(0, 50) + (rand(0, 99) / 100);
            $rate2 = rand(51, 100) + (rand(0, 99) / 100);

            $score1 = $this->calculator->calculate(
                $emailVerified,
                $successfulOrders,
                $rate1
            );

            $score2 = $this->calculator->calculate(
                $emailVerified,
                $successfulOrders,
                $rate2
            );

            // Higher payment rate should give higher score
            $this->assertGreaterThan(
                $score1,
                $score2,
                "Higher payment success rate should increase trust score"
            );
        }
    }

    /**
     * Property: Perfect customer gets maximum score
     * 
     * @test
     */
    public function property_perfect_customer_gets_maximum_score(): void
    {
        // Perfect customer: email verified, 8+ orders, 100% payment rate
        $score = $this->calculator->calculate(
            emailVerified: true,
            successfulOrders: 8,
            paymentSuccessRate: 100.0
        );

        // Should get exactly 100 points
        // 20 (email) + 40 (orders) + 40 (payment) = 100
        $this->assertEquals(
            100.0,
            $score,
            "Perfect customer should get maximum score of 100"
        );
    }

    /**
     * Property: New customer with no history gets minimum score
     * 
     * @test
     */
    public function property_new_customer_gets_minimum_score(): void
    {
        // New customer: no email, no orders, 0% payment rate
        $score = $this->calculator->calculate(
            emailVerified: false,
            successfulOrders: 0,
            paymentSuccessRate: 0.0
        );

        // Should get exactly 0 points
        $this->assertEquals(
            0.0,
            $score,
            "New customer with no history should get minimum score of 0"
        );
    }

    /**
     * Property: Trust level categorization is consistent
     * 
     * @test
     */
    public function property_trust_level_categorization_is_consistent(): void
    {
        // Test boundary values
        $this->assertEquals('very_low', $this->calculator->getTrustLevel(0.0));
        $this->assertEquals('very_low', $this->calculator->getTrustLevel(19.99));
        $this->assertEquals('low', $this->calculator->getTrustLevel(20.0));
        $this->assertEquals('low', $this->calculator->getTrustLevel(39.99));
        $this->assertEquals('fair', $this->calculator->getTrustLevel(40.0));
        $this->assertEquals('fair', $this->calculator->getTrustLevel(59.99));
        $this->assertEquals('good', $this->calculator->getTrustLevel(60.0));
        $this->assertEquals('good', $this->calculator->getTrustLevel(79.99));
        $this->assertEquals('excellent', $this->calculator->getTrustLevel(80.0));
        $this->assertEquals('excellent', $this->calculator->getTrustLevel(100.0));
    }

    /**
     * Property: Score breakdown components sum to total
     * 
     * @test
     */
    public function property_score_breakdown_components_sum_to_total(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $emailVerified = (bool) rand(0, 1);
            $successfulOrders = rand(0, 20);
            $paymentSuccessRate = rand(0, 100) + (rand(0, 99) / 100);

            $breakdown = $this->calculator->getScoreBreakdown(
                $emailVerified,
                $successfulOrders,
                $paymentSuccessRate
            );

            // Sum of components should equal total score
            $componentSum = $breakdown['email_verified']['points'] +
                           $breakdown['order_history']['points'] +
                           $breakdown['payment_rate']['points'];

            $this->assertEquals(
                $breakdown['total_score'],
                $componentSum,
                "Score breakdown components should sum to total score"
            );
        }
    }

    /**
     * Property: Trust threshold check is consistent
     * 
     * @test
     */
    public function property_trust_threshold_check_is_consistent(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $emailVerified = (bool) rand(0, 1);
            $successfulOrders = rand(0, 20);
            $paymentSuccessRate = rand(0, 100) + (rand(0, 99) / 100);
            $threshold = 40.0;

            $score = $this->calculator->calculate(
                $emailVerified,
                $successfulOrders,
                $paymentSuccessRate
            );

            $meetsThreshold = $this->calculator->meetsTrustThreshold($score, $threshold);

            // Manual check should match
            $expectedResult = $score >= $threshold;
            $this->assertEquals(
                $expectedResult,
                $meetsThreshold,
                "Trust threshold check should be consistent with score comparison"
            );
        }
    }

    /**
     * Property: Score prediction is accurate
     * 
     * @test
     */
    public function property_score_prediction_is_accurate(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $emailVerified = (bool) rand(0, 1);
            $currentOrders = rand(0, 10);
            $paymentSuccessRate = rand(0, 100) + (rand(0, 99) / 100);
            $additionalOrders = rand(1, 5);

            $prediction = $this->calculator->predictFutureScore(
                $emailVerified,
                $currentOrders,
                $paymentSuccessRate,
                $additionalOrders
            );

            // Manually calculate future score
            $expectedFutureScore = $this->calculator->calculate(
                $emailVerified,
                $currentOrders + $additionalOrders,
                $paymentSuccessRate
            );

            $this->assertEquals(
                $expectedFutureScore,
                $prediction['future_score'],
                "Predicted future score should match actual calculation"
            );
        }
    }

    /**
     * Property: Customer comparison is symmetric
     * 
     * @test
     */
    public function property_customer_comparison_is_symmetric(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $customer1 = [
                'email_verified' => (bool) rand(0, 1),
                'successful_orders' => rand(0, 20),
                'payment_success_rate' => rand(0, 100) + (rand(0, 99) / 100),
            ];

            $customer2 = [
                'email_verified' => (bool) rand(0, 1),
                'successful_orders' => rand(0, 20),
                'payment_success_rate' => rand(0, 100) + (rand(0, 99) / 100),
            ];

            $comparison1to2 = $this->calculator->compareCustomers($customer1, $customer2);
            $comparison2to1 = $this->calculator->compareCustomers($customer2, $customer1);

            // Scores should be swapped
            $this->assertEquals(
                $comparison1to2['customer1_score'],
                $comparison2to1['customer2_score']
            );

            $this->assertEquals(
                $comparison1to2['customer2_score'],
                $comparison2to1['customer1_score']
            );

            // Difference should be same magnitude
            $this->assertEquals(
                $comparison1to2['difference'],
                $comparison2to1['difference']
            );
        }
    }

    /**
     * Property: Score increases monotonically with better metrics
     * 
     * @test
     */
    public function property_score_increases_monotonically(): void
    {
        // Test email verification improvement
        $score1 = $this->calculator->calculate(false, 5, 80.0);
        $score2 = $this->calculator->calculate(true, 5, 80.0);
        $this->assertGreaterThan($score1, $score2);

        // Test order history improvement
        $score3 = $this->calculator->calculate(true, 3, 80.0);
        $score4 = $this->calculator->calculate(true, 5, 80.0);
        $this->assertGreaterThan($score3, $score4);

        // Test payment rate improvement
        $score5 = $this->calculator->calculate(true, 5, 70.0);
        $score6 = $this->calculator->calculate(true, 5, 90.0);
        $this->assertGreaterThan($score5, $score6);
    }

    /**
     * Property: Required improvements calculation is valid
     * 
     * @test
     */
    public function property_required_improvements_calculation_is_valid(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $emailVerified = false; // Room for improvement
            $successfulOrders = rand(0, 3);
            $paymentSuccessRate = rand(50, 80) + (rand(0, 99) / 100);

            $currentScore = $this->calculator->calculate(
                $emailVerified,
                $successfulOrders,
                $paymentSuccessRate
            );

            $targetScore = $currentScore + rand(10, 30);

            $improvements = $this->calculator->calculateRequiredImprovements(
                $currentScore,
                $targetScore,
                $emailVerified,
                $successfulOrders,
                $paymentSuccessRate
            );

            if ($improvements['target_reached']) {
                $this->assertGreaterThanOrEqual(
                    $targetScore,
                    $currentScore,
                    "If target is reached, current score should be >= target"
                );
            } else {
                $this->assertNotEmpty(
                    $improvements['improvements_needed'],
                    "If target not reached, improvements should be suggested"
                );
            }
        }
    }
}
