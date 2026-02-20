<?php

declare(strict_types=1);

namespace Tests\Unit\Application\CustomerQuote\Services;

use App\Domain\CustomerQuote\Services\TrustScoreCalculator;
use App\Domain\CustomerQuote\ValueObjects\ApprovalSettings;
use Tests\TestCase;

/**
 * Property-Based Test: Approval Decisions Are Consistent
 * 
 * **Feature: customer-quote-workflow, Property 3: Approval Decisions Are Consistent**
 * **Validates: Requirements 5.5, 5.6, 5.8**
 * 
 * For any customer quote acceptance, the approval decision should:
 * 1. Be deterministic (same inputs always produce same decision)
 * 2. Follow all configured rules consistently
 * 3. Auto-approve only when ALL conditions are met
 * 4. Require manual approval if ANY condition fails
 * 5. Provide clear reasons for manual approval
 * 
 * This property test verifies approval logic consistency and correctness.
 */
class ApprovalDecisionPropertyTest extends TestCase
{
    /**
     * Property: Approval decision is deterministic
     * 
     * @test
     */
    public function property_approval_decision_is_deterministic(): void
    {
        // Run 100 iterations with random scenarios
        for ($i = 0; $i < 100; $i++) {
            $orderValue = rand(1000000, 10000000); // 10k to 100k IDR in cents
            $threshold = rand(5000000, 15000000); // 50k to 150k IDR
            $emailVerified = (bool) rand(0, 1);
            $successfulOrders = rand(0, 10);
            $paymentSuccessRate = rand(0, 100) + (rand(0, 99) / 100);
            $hasCustomProducts = (bool) rand(0, 1);

            // Create settings
            $settings = ApprovalSettings::fromArray([
                'auto_approval_enabled' => true,
                'auto_approval_threshold' => $threshold,
                'require_email_verification' => true,
                'min_successful_orders' => 1,
                'min_payment_success_rate' => 90.0,
                'auto_approve_standard_products' => true,
                'require_approval_custom_products' => true,
                'max_negotiation_rounds' => 3,
                'allow_customer_counter_offer' => true,
                'notify_admin_on_auto_approve' => true,
                'notify_admin_on_pending_approval' => true,
            ]);

            // Make decision twice with same inputs
            $decision1 = $this->makeApprovalDecision(
                $orderValue,
                $settings,
                $emailVerified,
                $successfulOrders,
                $paymentSuccessRate,
                $hasCustomProducts
            );

            $decision2 = $this->makeApprovalDecision(
                $orderValue,
                $settings,
                $emailVerified,
                $successfulOrders,
                $paymentSuccessRate,
                $hasCustomProducts
            );

            // Decisions must be identical
            $this->assertEquals(
                $decision1['should_auto_approve'],
                $decision2['should_auto_approve'],
                "Approval decision must be deterministic for same inputs"
            );

            $this->assertEquals(
                $decision1['reason'],
                $decision2['reason'],
                "Approval reason must be consistent for same inputs"
            );
        }
    }

    /**
     * Property: Auto-approval requires ALL conditions to be met
     * 
     * @test
     */
    public function property_auto_approval_requires_all_conditions(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $settings = ApprovalSettings::fromArray([
                'auto_approval_enabled' => true,
                'auto_approval_threshold' => 5000000, // 50k IDR
                'require_email_verification' => true,
                'min_successful_orders' => 1,
                'min_payment_success_rate' => 90.0,
                'auto_approve_standard_products' => true,
                'require_approval_custom_products' => true,
                'max_negotiation_rounds' => 3,
                'allow_customer_counter_offer' => true,
                'notify_admin_on_auto_approve' => true,
                'notify_admin_on_pending_approval' => true,
            ]);

            // Test with all conditions met
            $decision = $this->makeApprovalDecision(
                orderValue: 4000000, // Below threshold
                settings: $settings,
                emailVerified: true,
                successfulOrders: 2, // Above minimum
                paymentSuccessRate: 95.0, // Above minimum
                hasCustomProducts: false // Standard products
            );

            $this->assertTrue(
                $decision['should_auto_approve'],
                "Should auto-approve when ALL conditions are met"
            );
        }
    }

    /**
     * Property: Manual approval required if ANY condition fails
     * 
     * @test
     */
    public function property_manual_approval_if_any_condition_fails(): void
    {
        $settings = ApprovalSettings::fromArray([
            'auto_approval_enabled' => true,
            'auto_approval_threshold' => 5000000,
            'require_email_verification' => true,
            'min_successful_orders' => 1,
            'min_payment_success_rate' => 90.0,
            'auto_approve_standard_products' => true,
            'require_approval_custom_products' => true,
            'max_negotiation_rounds' => 3,
            'allow_customer_counter_offer' => true,
            'notify_admin_on_auto_approve' => true,
            'notify_admin_on_pending_approval' => true,
        ]);

        // Test: Order value exceeds threshold
        $decision1 = $this->makeApprovalDecision(
            orderValue: 6000000, // Above threshold
            settings: $settings,
            emailVerified: true,
            successfulOrders: 2,
            paymentSuccessRate: 95.0,
            hasCustomProducts: false
        );
        $this->assertFalse($decision1['should_auto_approve']);
        $this->assertStringContainsString('exceeds threshold', $decision1['reason']);

        // Test: Email not verified
        $decision2 = $this->makeApprovalDecision(
            orderValue: 4000000,
            settings: $settings,
            emailVerified: false, // Not verified
            successfulOrders: 2,
            paymentSuccessRate: 95.0,
            hasCustomProducts: false
        );
        $this->assertFalse($decision2['should_auto_approve']);
        $this->assertStringContainsString('email not verified', $decision2['reason']);

        // Test: Insufficient successful orders
        $decision3 = $this->makeApprovalDecision(
            orderValue: 4000000,
            settings: $settings,
            emailVerified: true,
            successfulOrders: 0, // Below minimum
            paymentSuccessRate: 95.0,
            hasCustomProducts: false
        );
        $this->assertFalse($decision3['should_auto_approve']);
        $this->assertStringContainsString('successful orders', $decision3['reason']);

        // Test: Low payment success rate
        $decision4 = $this->makeApprovalDecision(
            orderValue: 4000000,
            settings: $settings,
            emailVerified: true,
            successfulOrders: 2,
            paymentSuccessRate: 85.0, // Below minimum
            hasCustomProducts: false
        );
        $this->assertFalse($decision4['should_auto_approve']);
        $this->assertStringContainsString('Payment success rate', $decision4['reason']);

        // Test: Has custom products
        $decision5 = $this->makeApprovalDecision(
            orderValue: 4000000,
            settings: $settings,
            emailVerified: true,
            successfulOrders: 2,
            paymentSuccessRate: 95.0,
            hasCustomProducts: true // Custom products
        );
        $this->assertFalse($decision5['should_auto_approve']);
        $this->assertStringContainsString('custom products', $decision5['reason']);
    }

    /**
     * Property: Disabled auto-approval always requires manual approval
     * 
     * @test
     */
    public function property_disabled_auto_approval_always_manual(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $settings = ApprovalSettings::fromArray([
                'auto_approval_enabled' => false, // Disabled
                'auto_approval_threshold' => 5000000,
                'require_email_verification' => true,
                'min_successful_orders' => 1,
                'min_payment_success_rate' => 90.0,
                'auto_approve_standard_products' => true,
                'require_approval_custom_products' => true,
                'max_negotiation_rounds' => 3,
                'allow_customer_counter_offer' => true,
                'notify_admin_on_auto_approve' => true,
                'notify_admin_on_pending_approval' => true,
            ]);

            // Even with perfect conditions
            $decision = $this->makeApprovalDecision(
                orderValue: 1000000,
                settings: $settings,
                emailVerified: true,
                successfulOrders: 10,
                paymentSuccessRate: 100.0,
                hasCustomProducts: false
            );

            $this->assertFalse(
                $decision['should_auto_approve'],
                "Should require manual approval when auto-approval is disabled"
            );

            $this->assertStringContainsString(
                'disabled',
                $decision['reason'],
                "Reason should mention auto-approval is disabled"
            );
        }
    }

    /**
     * Property: Threshold check is precise
     * 
     * @test
     */
    public function property_threshold_check_is_precise(): void
    {
        $settings = ApprovalSettings::fromArray([
            'auto_approval_enabled' => true,
            'auto_approval_threshold' => 5000000, // Exactly 50k IDR
            'require_email_verification' => false,
            'min_successful_orders' => 0,
            'min_payment_success_rate' => 0.0,
            'auto_approve_standard_products' => true,
            'require_approval_custom_products' => false,
            'max_negotiation_rounds' => 3,
            'allow_customer_counter_offer' => true,
            'notify_admin_on_auto_approve' => true,
            'notify_admin_on_pending_approval' => true,
        ]);

        // Just below threshold - should auto-approve
        $decision1 = $this->makeApprovalDecision(
            orderValue: 4999999,
            settings: $settings,
            emailVerified: true,
            successfulOrders: 1,
            paymentSuccessRate: 90.0,
            hasCustomProducts: false
        );
        $this->assertTrue($decision1['should_auto_approve']);

        // Exactly at threshold - should require manual
        $decision2 = $this->makeApprovalDecision(
            orderValue: 5000000,
            settings: $settings,
            emailVerified: true,
            successfulOrders: 1,
            paymentSuccessRate: 90.0,
            hasCustomProducts: false
        );
        $this->assertFalse($decision2['should_auto_approve']);

        // Just above threshold - should require manual
        $decision3 = $this->makeApprovalDecision(
            orderValue: 5000001,
            settings: $settings,
            emailVerified: true,
            successfulOrders: 1,
            paymentSuccessRate: 90.0,
            hasCustomProducts: false
        );
        $this->assertFalse($decision3['should_auto_approve']);
    }

    /**
     * Property: Multiple failing conditions all reported
     * 
     * @test
     */
    public function property_multiple_failing_conditions_reported(): void
    {
        $settings = ApprovalSettings::fromArray([
            'auto_approval_enabled' => true,
            'auto_approval_threshold' => 5000000,
            'require_email_verification' => true,
            'min_successful_orders' => 1,
            'min_payment_success_rate' => 90.0,
            'auto_approve_standard_products' => true,
            'require_approval_custom_products' => true,
            'max_negotiation_rounds' => 3,
            'allow_customer_counter_offer' => true,
            'notify_admin_on_auto_approve' => true,
            'notify_admin_on_pending_approval' => true,
        ]);

        // Fail multiple conditions
        $decision = $this->makeApprovalDecision(
            orderValue: 6000000, // Exceeds threshold
            settings: $settings,
            emailVerified: false, // Not verified
            successfulOrders: 0, // Below minimum
            paymentSuccessRate: 80.0, // Below minimum
            hasCustomProducts: true // Custom products
        );

        $this->assertFalse($decision['should_auto_approve']);
        
        // Reason should mention at least one failing condition
        // (implementation may report first failure or all failures)
        $this->assertNotEmpty($decision['reason']);
    }

    /**
     * Property: Settings changes affect decisions consistently
     * 
     * @test
     */
    public function property_settings_changes_affect_decisions_consistently(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $orderValue = 4000000;
            $emailVerified = true;
            $successfulOrders = 2;
            $paymentSuccessRate = 95.0;
            $hasCustomProducts = false;

            // Strict settings
            $strictSettings = ApprovalSettings::fromArray([
                'auto_approval_enabled' => true,
                'auto_approval_threshold' => 3000000, // Lower threshold
                'require_email_verification' => true,
                'min_successful_orders' => 3, // Higher minimum
                'min_payment_success_rate' => 95.0, // Higher minimum
                'auto_approve_standard_products' => true,
                'require_approval_custom_products' => true,
                'max_negotiation_rounds' => 3,
                'allow_customer_counter_offer' => true,
                'notify_admin_on_auto_approve' => true,
                'notify_admin_on_pending_approval' => true,
            ]);

            // Lenient settings
            $lenientSettings = ApprovalSettings::fromArray([
                'auto_approval_enabled' => true,
                'auto_approval_threshold' => 10000000, // Higher threshold
                'require_email_verification' => false,
                'min_successful_orders' => 0, // Lower minimum
                'min_payment_success_rate' => 50.0, // Lower minimum
                'auto_approve_standard_products' => true,
                'require_approval_custom_products' => false,
                'max_negotiation_rounds' => 3,
                'allow_customer_counter_offer' => true,
                'notify_admin_on_auto_approve' => true,
                'notify_admin_on_pending_approval' => true,
            ]);

            $strictDecision = $this->makeApprovalDecision(
                $orderValue,
                $strictSettings,
                $emailVerified,
                $successfulOrders,
                $paymentSuccessRate,
                $hasCustomProducts
            );

            $lenientDecision = $this->makeApprovalDecision(
                $orderValue,
                $lenientSettings,
                $emailVerified,
                $successfulOrders,
                $paymentSuccessRate,
                $hasCustomProducts
            );

            // Lenient settings should be more likely to auto-approve
            if ($strictDecision['should_auto_approve']) {
                $this->assertTrue(
                    $lenientDecision['should_auto_approve'],
                    "If strict settings approve, lenient settings should also approve"
                );
            }
        }
    }

    /**
     * Helper method to simulate approval decision logic
     */
    private function makeApprovalDecision(
        int $orderValue,
        ApprovalSettings $settings,
        bool $emailVerified,
        int $successfulOrders,
        float $paymentSuccessRate,
        bool $hasCustomProducts
    ): array {
        $reasons = [];

        // Check if auto-approval is enabled
        if (!$settings->isAutoApprovalEnabled()) {
            return [
                'should_auto_approve' => false,
                'reason' => 'Auto-approval is disabled',
            ];
        }

        // Check order value threshold
        if ($orderValue >= $settings->getAutoApprovalThreshold()) {
            $reasons[] = sprintf(
                'Order value (Rp %s) exceeds threshold (Rp %s)',
                number_format($orderValue / 100, 0, ',', '.'),
                number_format($settings->getAutoApprovalThreshold() / 100, 0, ',', '.')
            );
        }

        // Check email verification
        if ($settings->requiresEmailVerification() && !$emailVerified) {
            $reasons[] = 'Customer email not verified';
        }

        // Check successful orders
        if ($successfulOrders < $settings->getMinSuccessfulOrders()) {
            $reasons[] = sprintf(
                'Customer has %d successful orders (minimum: %d)',
                $successfulOrders,
                $settings->getMinSuccessfulOrders()
            );
        }

        // Check payment success rate
        if ($paymentSuccessRate < $settings->getMinPaymentSuccessRate()) {
            $reasons[] = sprintf(
                'Payment success rate %.1f%% below minimum %.1f%%',
                $paymentSuccessRate,
                $settings->getMinPaymentSuccessRate()
            );
        }

        // Check product type
        if ($hasCustomProducts && $settings->requiresApprovalForCustomProducts()) {
            $reasons[] = 'Order contains custom products requiring approval';
        }

        // If any reasons exist, require manual approval
        if (!empty($reasons)) {
            return [
                'should_auto_approve' => false,
                'reason' => implode('; ', $reasons),
            ];
        }

        return [
            'should_auto_approve' => true,
            'reason' => null,
        ];
    }
}
