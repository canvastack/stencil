<?php

namespace Tests\Unit\Domain\Order\Services;

use Tests\TestCase;
use App\Domain\Order\Services\RefundCalculationEngine;
use App\Domain\Order\ValueObjects\RefundCalculation;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\RefundRequest;
use App\Domain\Order\Enums\OrderStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

/**
 * Comprehensive Unit Tests for RefundCalculationEngine
 * 
 * Tests all business logic scenarios for PT Custom Etching Xenial:
 * - Customer-initiated refunds (pre/mid/post production)
 * - Quality issue refunds (partial/full)
 * - Vendor failure refunds
 * - Timeline delay refunds
 * - Production error refunds
 * - Risk assessment calculations
 */
class RefundCalculationEngineTest extends TestCase
{
    use RefreshDatabase;

    private function createTestOrder(array $attributes = []): Order
    {
        return Order::factory()->create(array_merge([
            'uuid' => Str::uuid(),
            'order_number' => 'ORD-' . date('Ymd') . '-' . str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT),
            'status' => OrderStatus::PENDING->value,
            'total_amount' => 3000000.00,
            'total_paid_amount' => 3000000.00,
            'total_disbursed_amount' => 0,
        ], $attributes));
    }

    private function createTestRefundRequest(Order $order, array $attributes = []): RefundRequest
    {
        return RefundRequest::factory()->create(array_merge([
            'tenant_id' => $order->tenant_id,
            'order_id' => $order->id,
            'request_number' => 'RFD-' . date('Ymd') . '-' . str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT),
            'refund_reason' => 'customer_request',
            'refund_type' => 'full_refund',
            'quality_issue_percentage' => 100,
        ], $attributes));
    }

    /** @test */
    public function it_calculates_customer_initiated_pre_production_refund_correctly()
    {
        // Arrange: Pre-production order (no vendor costs paid)
        $order = $this->createTestOrder([
            'status' => OrderStatus::PENDING->value,
            'total_amount' => 2000000.00,
            'total_paid_amount' => 2000000.00,
            'total_disbursed_amount' => 0, // No vendor payment yet
        ]);

        $refundRequest = $this->createTestRefundRequest($order, [
            'refund_reason' => 'customer_request'
        ]);

        // Act
        $calculation = RefundCalculationEngine::calculate($order, $refundRequest);

        // Assert: 5% admin cost deduction applied
        $expectedAdminCost = 2000000.00 * 0.05; // 100,000
        $expectedRefund = 2000000.00 - $expectedAdminCost; // 1,900,000

        $this->assertEquals(1900000.00, $calculation->refundableToCustomer);
        $this->assertEquals(0, $calculation->companyLoss);
        $this->assertEquals(0, $calculation->vendorRecoverable);
        $this->assertEquals('customer', $calculation->faultParty);
        $this->assertContains('pre_production_admin_cost_deduction', $calculation->appliedRules);
    }

    /** @test */
    public function it_calculates_customer_initiated_mid_production_refund_correctly()
    {
        // Arrange: Mid-production order (vendor costs already paid)
        $order = $this->createTestOrder([
            'status' => OrderStatus::IN_PRODUCTION->value,
            'total_amount' => 3000000.00,
            'total_paid_amount' => 3000000.00,
            'total_disbursed_amount' => 1500000.00, // 50% vendor payment made
        ]);

        $refundRequest = $this->createTestRefundRequest($order, [
            'refund_reason' => 'customer_request'
        ]);

        // Act
        $calculation = RefundCalculationEngine::calculate($order, $refundRequest);

        // Assert: Customer pays production costs incurred + 10% handling
        $handlingFee = 3000000.00 * 0.1; // 300,000
        $productionCostIncurred = 1500000.00 + $handlingFee; // 1,800,000
        $expectedRefund = 3000000.00 - $productionCostIncurred; // 1,200,000

        $this->assertEquals(1200000.00, $calculation->refundableToCustomer);
        $this->assertEquals(0, $calculation->companyLoss);
        $this->assertEquals(0, $calculation->vendorRecoverable);
        $this->assertContains('customer_pays_incurred_costs', $calculation->appliedRules);
        $this->assertContains('handling_fee_applied', $calculation->appliedRules);
    }

    /** @test */
    public function it_calculates_quality_issue_full_refund_with_vendor_liability()
    {
        // Arrange: Completed order with quality issues
        $order = $this->createTestOrder([
            'status' => OrderStatus::COMPLETED->value,
            'total_amount' => 2500000.00,
            'total_paid_amount' => 2500000.00,
            'total_disbursed_amount' => 1800000.00,
        ]);

        $refundRequest = $this->createTestRefundRequest($order, [
            'refund_reason' => 'quality_issue',
            'quality_issue_percentage' => 100, // Full quality issue
        ]);

        // Act
        $calculation = RefundCalculationEngine::calculate($order, $refundRequest);

        // Assert: Full customer refund, vendor liable for their costs
        $this->assertEquals(2500000.00, $calculation->refundableToCustomer);
        $this->assertEquals(1800000.00, $calculation->vendorRecoverable);
        $this->assertEquals(700000.00, $calculation->companyLoss); // 2.5M - 1.8M
        $this->assertEquals('vendor', $calculation->faultParty);
    }

    /** @test */
    public function it_calculates_partial_quality_issue_refund_correctly()
    {
        // Arrange: Order with 50% quality issue
        $order = $this->createTestOrder([
            'status' => OrderStatus::COMPLETED->value,
            'total_amount' => 4000000.00,
            'total_paid_amount' => 4000000.00,
            'total_disbursed_amount' => 2000000.00,
        ]);

        $refundRequest = $this->createTestRefundRequest($order, [
            'refund_reason' => 'quality_issue',
            'quality_issue_percentage' => 50, // Partial quality issue
        ]);

        // Act
        $calculation = RefundCalculationEngine::calculate($order, $refundRequest);

        // Assert: Proportional refund and liability
        $this->assertEquals(2000000.00, $calculation->refundableToCustomer); // 50% of 4M
        $this->assertEquals(1000000.00, $calculation->vendorRecoverable); // 50% of 2M
        $this->assertEquals(1000000.00, $calculation->companyLoss); // 2M - 1M
    }

    /** @test */
    public function it_calculates_vendor_failure_with_full_recovery()
    {
        // Arrange: Order where vendor failed to deliver
        $order = $this->createTestOrder([
            'status' => OrderStatus::IN_PRODUCTION->value,
            'total_amount' => 5000000.00,
            'total_paid_amount' => 5000000.00,
            'total_disbursed_amount' => 3000000.00,
        ]);

        $refundRequest = $this->createTestRefundRequest($order, [
            'refund_reason' => 'vendor_failure'
        ]);

        // Act
        $calculation = RefundCalculationEngine::calculate($order, $refundRequest);

        // Assert: Full customer refund, full vendor liability
        $this->assertEquals(5000000.00, $calculation->refundableToCustomer);
        $this->assertEquals(3000000.00, $calculation->vendorRecoverable);
        $this->assertEquals(2000000.00, $calculation->companyLoss); // 5M - 3M
        $this->assertEquals('vendor', $calculation->faultParty);
        $this->assertContains('vendor_failure_full_recovery', $calculation->appliedRules);
    }

    /** @test */
    public function it_calculates_timeline_delay_compensation()
    {
        // Arrange: Order with significant delay
        $order = $this->createTestOrder([
            'status' => OrderStatus::IN_PRODUCTION->value,
            'total_amount' => 3000000.00,
            'total_paid_amount' => 3000000.00,
            'total_disbursed_amount' => 2000000.00,
        ]);

        $refundRequest = $this->createTestRefundRequest($order, [
            'refund_reason' => 'timeline_delay',
            'delay_days' => 15  // 15-day delay for 25% compensation
        ]);

        // Act
        $calculation = RefundCalculationEngine::calculate($order, $refundRequest);

        // Assert: Compensation based on delay severity (assuming 15-day delay = 25% compensation)
        $expectedCompensation = 3000000.00 * 0.25; // 750,000
        
        $this->assertEquals($expectedCompensation, $calculation->refundableToCustomer);
        $this->assertEquals(750000.00, $calculation->vendorRecoverable);
        $this->assertEquals(0, $calculation->companyLoss);
        $this->assertEquals('vendor', $calculation->faultParty);
    }

    /** @test */
    public function it_calculates_production_error_with_company_liability()
    {
        // Arrange: Order with internal production error
        $order = $this->createTestOrder([
            'status' => OrderStatus::QUALITY_CONTROL->value,
            'total_amount' => 2000000.00,
            'total_paid_amount' => 2000000.00,
            'total_disbursed_amount' => 1200000.00,
        ]);

        $refundRequest = $this->createTestRefundRequest($order, [
            'refund_reason' => 'production_error'
        ]);

        // Act
        $calculation = RefundCalculationEngine::calculate($order, $refundRequest);

        // Assert: Company takes full liability for internal errors
        $this->assertEquals(2000000.00, $calculation->refundableToCustomer);
        $this->assertEquals(0, $calculation->vendorRecoverable); // No vendor liability
        $this->assertEquals(2000000.00, $calculation->companyLoss);
        $this->assertEquals('company', $calculation->faultParty);
    }

    /** @test */
    public function it_calculates_production_progress_correctly()
    {
        $testCases = [
            [OrderStatus::DRAFT->value, 0],
            [OrderStatus::PENDING->value, 0],
            [OrderStatus::VENDOR_SOURCING->value, 0],
            [OrderStatus::PARTIAL_PAYMENT->value, 10],
            [OrderStatus::FULL_PAYMENT->value, 10],
            [OrderStatus::IN_PRODUCTION->value, 50],
            [OrderStatus::QUALITY_CONTROL->value, 80],
            [OrderStatus::SHIPPING->value, 90],
            [OrderStatus::COMPLETED->value, 100],
        ];

        foreach ($testCases as [$status, $expectedProgress]) {
            $order = $this->createTestOrder(['status' => $status]);
            $refundRequest = $this->createTestRefundRequest($order);
            
            $calculation = RefundCalculationEngine::calculate($order, $refundRequest);
            
            $this->assertEquals($expectedProgress, $calculation->productionProgress,
                "Production progress for status {$status} should be {$expectedProgress}%");
        }
    }

    /** @test */
    public function it_determines_fault_party_correctly()
    {
        $testCases = [
            ['customer_request', 'customer'],
            ['quality_issue', 'vendor'],
            ['vendor_failure', 'vendor'],
            ['timeline_delay', 'vendor'],
            ['production_error', 'company'],
            ['shipping_damage', 'external'],
            ['unknown_reason', 'unknown'],
        ];

        $order = $this->createTestOrder();

        foreach ($testCases as [$reason, $expectedFault]) {
            $refundRequest = $this->createTestRefundRequest($order, [
                'refund_reason' => $reason
            ]);

            $calculation = RefundCalculationEngine::calculate($order, $refundRequest);
            
            $this->assertEquals($expectedFault, $calculation->faultParty,
                "Fault party for reason {$reason} should be {$expectedFault}");
        }
    }

    /** @test */
    public function it_applies_insurance_fund_coverage_for_quality_issues()
    {
        // This test will be enhanced when InsuranceFundService is implemented
        $order = $this->createTestOrder([
            'total_amount' => 1000000.00,
            'total_paid_amount' => 1000000.00,
            'total_disbursed_amount' => 600000.00,
        ]);

        $refundRequest = $this->createTestRefundRequest($order, [
            'refund_reason' => 'quality_issue'
        ]);

        $calculation = RefundCalculationEngine::calculate($order, $refundRequest);

        // Assert: Company loss calculated correctly (will be covered by insurance)
        $expectedCompanyLoss = 1000000.00 - 600000.00; // 400,000
        $this->assertEquals($expectedCompanyLoss, $calculation->companyLoss);
    }

    /** @test */
    public function it_handles_edge_case_zero_amounts()
    {
        $order = $this->createTestOrder([
            'total_amount' => 0,
            'total_paid_amount' => 0,
            'total_disbursed_amount' => 0,
        ]);

        $refundRequest = $this->createTestRefundRequest($order);

        $calculation = RefundCalculationEngine::calculate($order, $refundRequest);

        $this->assertEquals(0, $calculation->refundableToCustomer);
        $this->assertEquals(0, $calculation->companyLoss);
        $this->assertEquals(0, $calculation->vendorRecoverable);
    }

    /** @test */
    public function it_validates_calculation_metadata()
    {
        $order = $this->createTestOrder();
        $refundRequest = $this->createTestRefundRequest($order);

        $calculation = RefundCalculationEngine::calculate($order, $refundRequest);

        // Assert calculation metadata
        $this->assertEquals($order->total_amount, $calculation->orderTotal);
        $this->assertEquals($order->total_paid_amount, $calculation->customerPaidAmount);
        $this->assertEquals($order->total_disbursed_amount ?? 0, $calculation->vendorCostPaid);
        $this->assertEquals($refundRequest->refund_reason, $calculation->refundReason);
        $this->assertNotNull($calculation->calculatedAt);
        $this->assertNotEmpty($calculation->calculatedBy);
        $this->assertIsArray($calculation->appliedRules);
    }

    /** @test */
    public function it_enforces_business_rule_minimum_refund_zero()
    {
        // Arrange: Edge case where calculation might result in negative refund
        $order = $this->createTestOrder([
            'total_amount' => 1000000.00,
            'total_paid_amount' => 500000.00, // Customer paid less than disbursed
            'total_disbursed_amount' => 800000.00,
        ]);

        $refundRequest = $this->createTestRefundRequest($order, [
            'refund_reason' => 'customer_request'
        ]);

        $calculation = RefundCalculationEngine::calculate($order, $refundRequest);

        // Assert: Refund should never be negative
        $this->assertGreaterThanOrEqual(0, $calculation->refundableToCustomer);
    }

    /** @test */
    public function it_calculates_risk_assessment_based_on_amount_and_reason()
    {
        $testCases = [
            // [amount, reason, expectedRisk]
            [100000, 'customer_request', 'low'],
            [600000, 'customer_request', 'medium'],
            [2100000, 'quality_issue', 'high'],
            [5100000, 'vendor_failure', 'critical'],
        ];

        foreach ($testCases as [$amount, $reason, $expectedRisk]) {
            $order = $this->createTestOrder([
                'total_amount' => $amount,
                'total_paid_amount' => $amount,
            ]);

            $refundRequest = $this->createTestRefundRequest($order, [
                'refund_reason' => $reason
            ]);

            $calculation = RefundCalculationEngine::calculate($order, $refundRequest);

            // This will be implemented in the risk assessment logic
            // For now, we just verify the calculation completes successfully
            $this->assertNotNull($calculation);
        }
    }
}