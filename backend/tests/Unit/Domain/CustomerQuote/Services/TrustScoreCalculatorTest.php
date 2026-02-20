<?php

namespace Tests\Unit\Domain\CustomerQuote\Services;

use App\Domain\CustomerQuote\Services\TrustScoreCalculator;
use Tests\TestCase;

class TrustScoreCalculatorTest extends TestCase
{
    private TrustScoreCalculator $calculator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calculator = new TrustScoreCalculator();
    }

    /** @test */
    public function it_calculates_zero_score_for_new_customer(): void
    {
        // Arrange - New customer with no history
        $emailVerified = false;
        $successfulOrders = 0;
        $paymentSuccessRate = 0.0;

        // Act
        $score = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);

        // Assert
        $this->assertEquals(0.0, $score);
    }

    /** @test */
    public function it_calculates_20_points_for_verified_email_only(): void
    {
        // Arrange - Only email verified
        $emailVerified = true;
        $successfulOrders = 0;
        $paymentSuccessRate = 0.0;

        // Act
        $score = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);

        // Assert
        $this->assertEquals(20.0, $score);
    }

    /** @test */
    public function it_calculates_5_points_per_successful_order(): void
    {
        // Arrange - 3 successful orders
        $emailVerified = false;
        $successfulOrders = 3;
        $paymentSuccessRate = 0.0;

        // Act
        $score = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);

        // Assert
        $this->assertEquals(15.0, $score); // 3 * 5 = 15
    }

    /** @test */
    public function it_caps_order_history_points_at_40(): void
    {
        // Arrange - 10 successful orders (would be 50 points without cap)
        $emailVerified = false;
        $successfulOrders = 10;
        $paymentSuccessRate = 0.0;

        // Act
        $score = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);

        // Assert
        $this->assertEquals(40.0, $score); // Capped at 40
    }

    /** @test */
    public function it_calculates_payment_success_rate_proportionally(): void
    {
        // Arrange - 50% payment success rate
        $emailVerified = false;
        $successfulOrders = 0;
        $paymentSuccessRate = 50.0;

        // Act
        $score = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);

        // Assert
        $this->assertEquals(20.0, $score); // 50% of 40 max points = 20
    }

    /** @test */
    public function it_calculates_perfect_payment_rate_as_40_points(): void
    {
        // Arrange - 100% payment success rate
        $emailVerified = false;
        $successfulOrders = 0;
        $paymentSuccessRate = 100.0;

        // Act
        $score = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);

        // Assert
        $this->assertEquals(40.0, $score);
    }

    /** @test */
    public function it_calculates_maximum_score_of_100(): void
    {
        // Arrange - Perfect customer
        $emailVerified = true;
        $successfulOrders = 8; // 8 * 5 = 40 points
        $paymentSuccessRate = 100.0;

        // Act
        $score = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);

        // Assert
        $this->assertEquals(100.0, $score); // 20 + 40 + 40 = 100
    }

    /** @test */
    public function it_caps_total_score_at_100(): void
    {
        // Arrange - More than enough for 100 points
        $emailVerified = true;
        $successfulOrders = 20; // Would be 100 points alone
        $paymentSuccessRate = 100.0;

        // Act
        $score = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);

        // Assert
        $this->assertEquals(100.0, $score); // Capped at 100
    }

    /** @test */
    public function it_calculates_mixed_scenario_correctly(): void
    {
        // Arrange - Typical customer
        $emailVerified = true; // 20 points
        $successfulOrders = 5; // 25 points
        $paymentSuccessRate = 75.0; // 30 points

        // Act
        $score = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);

        // Assert
        $this->assertEquals(75.0, $score); // 20 + 25 + 30 = 75
    }

    /** @test */
    public function it_is_deterministic_with_same_inputs(): void
    {
        // Arrange
        $emailVerified = true;
        $successfulOrders = 3;
        $paymentSuccessRate = 60.0;

        // Act - Calculate multiple times
        $score1 = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);
        $score2 = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);
        $score3 = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);

        // Assert - All results should be identical
        $this->assertEquals($score1, $score2);
        $this->assertEquals($score2, $score3);
        $this->assertEquals(59.0, $score1); // 20 + 15 + 24 = 59
    }

    /** @test */
    public function it_handles_zero_payment_rate(): void
    {
        // Arrange
        $emailVerified = true;
        $successfulOrders = 2;
        $paymentSuccessRate = 0.0;

        // Act
        $score = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);

        // Assert
        $this->assertEquals(30.0, $score); // 20 + 10 + 0 = 30
    }

    /** @test */
    public function it_handles_fractional_payment_rates(): void
    {
        // Arrange - 33.33% payment rate
        $emailVerified = false;
        $successfulOrders = 0;
        $paymentSuccessRate = 33.33;

        // Act
        $score = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);

        // Assert - Use delta for floating point comparison
        $this->assertEqualsWithDelta(13.332, $score, 0.001); // 33.33% of 40 = 13.332
    }

    /** @test */
    public function it_returns_trust_level_excellent_for_high_scores(): void
    {
        // Act
        $level = $this->calculator->getTrustLevel(85.0);

        // Assert
        $this->assertEquals('excellent', $level);
    }

    /** @test */
    public function it_returns_trust_level_good_for_moderate_scores(): void
    {
        // Act
        $level = $this->calculator->getTrustLevel(65.0);

        // Assert
        $this->assertEquals('good', $level);
    }

    /** @test */
    public function it_returns_trust_level_fair_for_average_scores(): void
    {
        // Act
        $level = $this->calculator->getTrustLevel(45.0);

        // Assert
        $this->assertEquals('fair', $level);
    }

    /** @test */
    public function it_returns_trust_level_low_for_poor_scores(): void
    {
        // Act
        $level = $this->calculator->getTrustLevel(25.0);

        // Assert
        $this->assertEquals('low', $level);
    }

    /** @test */
    public function it_returns_trust_level_very_low_for_minimal_scores(): void
    {
        // Act
        $level = $this->calculator->getTrustLevel(10.0);

        // Assert
        $this->assertEquals('very_low', $level);
    }

    /** @test */
    public function it_provides_trust_level_descriptions(): void
    {
        // Act
        $description = $this->calculator->getTrustLevelDescription(85.0);

        // Assert
        $this->assertStringContainsString('Highly trusted', $description);
    }

    /** @test */
    public function it_checks_trust_threshold_correctly(): void
    {
        // Assert
        $this->assertTrue($this->calculator->meetsTrustThreshold(50.0, 40.0));
        $this->assertFalse($this->calculator->meetsTrustThreshold(30.0, 40.0));
        $this->assertTrue($this->calculator->meetsTrustThreshold(40.0, 40.0)); // Exact match
    }

    /** @test */
    public function it_provides_score_breakdown(): void
    {
        // Arrange
        $emailVerified = true;
        $successfulOrders = 3;
        $paymentSuccessRate = 50.0;

        // Act
        $breakdown = $this->calculator->getScoreBreakdown($emailVerified, $successfulOrders, $paymentSuccessRate);

        // Assert
        $this->assertArrayHasKey('email_verified', $breakdown);
        $this->assertArrayHasKey('order_history', $breakdown);
        $this->assertArrayHasKey('payment_rate', $breakdown);
        $this->assertArrayHasKey('total_score', $breakdown);
        $this->assertArrayHasKey('trust_level', $breakdown);
        
        $this->assertEquals(20, $breakdown['email_verified']['points']);
        $this->assertEquals(15, $breakdown['order_history']['points']);
        $this->assertEquals(20.0, $breakdown['payment_rate']['points']);
        $this->assertEquals(55.0, $breakdown['total_score']);
        $this->assertEquals('fair', $breakdown['trust_level']);
    }

    /** @test */
    public function it_calculates_from_customer_object(): void
    {
        // Arrange - Mock customer object
        $customer = (object) [
            'email_verified_at' => now(),
            'successful_orders_count' => 4,
            'payment_success_rate' => 80.0,
        ];

        // Act
        $score = $this->calculator->calculateFromCustomer($customer);

        // Assert
        $this->assertEquals(72.0, $score); // 20 + 20 + 32 = 72
    }

    /** @test */
    public function it_handles_customer_object_with_null_email_verification(): void
    {
        // Arrange
        $customer = (object) [
            'email_verified_at' => null,
            'successful_orders_count' => 2,
            'payment_success_rate' => 50.0,
        ];

        // Act
        $score = $this->calculator->calculateFromCustomer($customer);

        // Assert
        $this->assertEquals(30.0, $score); // 0 + 10 + 20 = 30
    }

    /** @test */
    public function it_handles_customer_object_with_missing_fields(): void
    {
        // Arrange - Customer with missing optional fields
        $customer = (object) [];

        // Act
        $score = $this->calculator->calculateFromCustomer($customer);

        // Assert
        $this->assertEquals(0.0, $score);
    }

    /** @test */
    public function it_calculates_required_improvements_for_target_score(): void
    {
        // Arrange
        $currentScore = 30.0;
        $targetScore = 60.0;
        $emailVerified = false;
        $successfulOrders = 2;
        $paymentSuccessRate = 25.0;

        // Act
        $improvements = $this->calculator->calculateRequiredImprovements(
            $currentScore,
            $targetScore,
            $emailVerified,
            $successfulOrders,
            $paymentSuccessRate
        );

        // Assert
        $this->assertFalse($improvements['target_reached']);
        $this->assertEquals(30.0, $improvements['points_needed']);
        $this->assertNotEmpty($improvements['improvements_needed']);
        
        // Should suggest email verification first
        $this->assertEquals('verify_email', $improvements['improvements_needed'][0]['action']);
    }

    /** @test */
    public function it_indicates_when_target_is_already_reached(): void
    {
        // Arrange
        $currentScore = 70.0;
        $targetScore = 60.0;

        // Act
        $improvements = $this->calculator->calculateRequiredImprovements(
            $currentScore,
            $targetScore,
            true,
            5,
            75.0
        );

        // Assert
        $this->assertTrue($improvements['target_reached']);
        $this->assertEmpty($improvements['improvements_needed']);
    }

    /** @test */
    public function it_predicts_future_score_with_additional_orders(): void
    {
        // Arrange
        $emailVerified = true;
        $successfulOrders = 2;
        $paymentSuccessRate = 50.0;
        $additionalOrders = 3;

        // Act
        $prediction = $this->calculator->predictFutureScore(
            $emailVerified,
            $successfulOrders,
            $paymentSuccessRate,
            $additionalOrders
        );

        // Assert
        $this->assertEquals(50.0, $prediction['current_score']); // 20 + 10 + 20
        $this->assertEquals(65.0, $prediction['future_score']); // 20 + 25 + 20
        $this->assertEquals(15.0, $prediction['score_increase']);
        $this->assertArrayHasKey('current_level', $prediction);
        $this->assertArrayHasKey('future_level', $prediction);
    }

    /** @test */
    public function it_predicts_future_score_with_improved_payment_rate(): void
    {
        // Arrange
        $emailVerified = true;
        $successfulOrders = 3;
        $paymentSuccessRate = 50.0;
        $newPaymentRate = 80.0;

        // Act
        $prediction = $this->calculator->predictFutureScore(
            $emailVerified,
            $successfulOrders,
            $paymentSuccessRate,
            0,
            $newPaymentRate
        );

        // Assert
        $this->assertEquals(55.0, $prediction['current_score']); // 20 + 15 + 20
        $this->assertEquals(67.0, $prediction['future_score']); // 20 + 15 + 32
        $this->assertEquals(12.0, $prediction['score_increase']);
    }

    /** @test */
    public function it_compares_two_customers_trust_scores(): void
    {
        // Arrange
        $customer1 = [
            'email_verified' => true,
            'successful_orders' => 5,
            'payment_success_rate' => 80.0,
        ];

        $customer2 = [
            'email_verified' => false,
            'successful_orders' => 2,
            'payment_success_rate' => 50.0,
        ];

        // Act
        $comparison = $this->calculator->compareCustomers($customer1, $customer2);

        // Assert
        $this->assertEquals(77.0, $comparison['customer1_score']); // 20 + 25 + 32
        $this->assertEquals(30.0, $comparison['customer2_score']); // 0 + 10 + 20
        $this->assertEquals(47.0, $comparison['difference']);
        $this->assertEquals('customer1', $comparison['higher_trust']);
        $this->assertEquals('good', $comparison['customer1_level']);
        $this->assertEquals('low', $comparison['customer2_level']);
    }

    /** @test */
    public function it_handles_equal_trust_scores_in_comparison(): void
    {
        // Arrange - Both customers have same score
        $customer1 = [
            'email_verified' => true,
            'successful_orders' => 2,
            'payment_success_rate' => 50.0,
        ];

        $customer2 = [
            'email_verified' => false,
            'successful_orders' => 6,
            'payment_success_rate' => 50.0,
        ];

        // Act
        $comparison = $this->calculator->compareCustomers($customer1, $customer2);

        // Assert
        $this->assertEquals(50.0, $comparison['customer1_score']); // 20 + 10 + 20
        $this->assertEquals(50.0, $comparison['customer2_score']); // 0 + 30 + 20
        $this->assertEquals(0.0, $comparison['difference']);
        $this->assertEquals('equal', $comparison['higher_trust']);
    }

    /** @test */
    public function it_ensures_score_never_goes_below_zero(): void
    {
        // Arrange - Edge case with negative inputs (shouldn't happen but test defensive code)
        $emailVerified = false;
        $successfulOrders = 0;
        $paymentSuccessRate = -10.0; // Invalid but test handling

        // Act
        $score = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);

        // Assert
        $this->assertGreaterThanOrEqual(0.0, $score);
    }

    /** @test */
    public function it_ensures_score_never_exceeds_100(): void
    {
        // Arrange - Edge case with excessive values
        $emailVerified = true;
        $successfulOrders = 100;
        $paymentSuccessRate = 150.0; // Invalid but test handling

        // Act
        $score = $this->calculator->calculate($emailVerified, $successfulOrders, $paymentSuccessRate);

        // Assert
        $this->assertLessThanOrEqual(100.0, $score);
    }

    /** @test */
    public function it_calculates_consistently_for_boundary_values(): void
    {
        // Test boundary at 80 points (excellent threshold)
        $score80 = $this->calculator->calculate(true, 8, 75.0); // 20 + 40 + 30 = 90
        $this->assertEquals('excellent', $this->calculator->getTrustLevel($score80));

        // Test boundary at 60 points (good threshold)
        $score60 = $this->calculator->calculate(true, 4, 50.0); // 20 + 20 + 20 = 60
        $this->assertEquals('good', $this->calculator->getTrustLevel($score60));

        // Test boundary at 40 points (fair threshold)
        $score40 = $this->calculator->calculate(true, 2, 25.0); // 20 + 10 + 10 = 40
        $this->assertEquals('fair', $this->calculator->getTrustLevel($score40));

        // Test boundary at 20 points (low threshold)
        $score20 = $this->calculator->calculate(true, 0, 0.0); // 20 + 0 + 0 = 20
        $this->assertEquals('low', $this->calculator->getTrustLevel($score20));
    }
}
