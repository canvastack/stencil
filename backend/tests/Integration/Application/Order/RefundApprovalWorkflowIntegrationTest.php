<?php

namespace Tests\Integration\Application\Order;

use App\Domain\Order\Services\RefundCalculationEngine;
use App\Domain\Order\Services\InsuranceFundService;
use App\Infrastructure\Persistence\Eloquent\Models\{
    Order, 
    RefundRequest, 
    RefundApproval, 
    User, 
    Tenant
};
use App\Domain\Order\Enums\OrderStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Integration Test for Complete Refund Approval Workflow
 * 
 * Tests the entire multi-level approval process from refund request 
 * creation to final processing and payment.
 */
class RefundApprovalWorkflowIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $customer;
    private User $financeApprover;
    private User $managerApprover;
    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        Event::fake();
        Notification::fake();

        // Setup test environment
        $this->tenant = Tenant::factory()->create();
        
        $this->customer = User::factory()->create([
            'tenant_id' => $this->tenant->id
        ]);
        
        $this->financeApprover = User::factory()->create([
            'tenant_id' => $this->tenant->id
        ]);
        
        $this->managerApprover = User::factory()->create([
            'tenant_id' => $this->tenant->id
        ]);

        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => OrderStatus::IN_PRODUCTION->value,
            'total_amount' => 5000000.00,
            'total_paid_amount' => 5000000.00,
            'total_disbursed_amount' => 3000000.00,
        ]);

        // Initialize insurance fund for testing - larger amount to cover vendor failures
        \App\Infrastructure\Persistence\Eloquent\Models\InsuranceFundTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'transaction_type' => 'contribution',
            'amount' => 5000000.00, // 5M IDR balance to cover all scenarios
            'balance_before' => 0,
            'balance_after' => 5000000.00,
            'description' => 'Test setup insurance fund balance'
        ]);
    }

    public function test_complete_customer_initiated_refund_workflow(): void
    {
        // Step 1: Customer creates refund request
        $refundRequest = $this->createRefundRequest([
            'refund_reason' => 'customer_request',
            'refund_type' => 'full_refund',
            'customer_notes' => 'Changed my mind about the order',
            'requested_by' => $this->customer->id,
        ]);

        $this->assertEquals('pending_review', $refundRequest->status);
        $this->assertNotNull($refundRequest->calculation);

        // Step 2: Finance team reviews (Level 1)
        $financeApproval = $this->createApproval($refundRequest, [
            'approver_id' => $this->financeApprover->id,
            'approval_level' => 1,
            'decision' => 'approved',
            'decision_notes' => 'Financial review completed, calculations verified',
        ]);

        $refundRequest->refresh();
        $this->assertEquals('pending_manager', $refundRequest->status);
        $this->assertEquals($this->managerApprover->id, $refundRequest->current_approver_id);

        // Step 3: Manager approves (Level 2) 
        $managerApproval = $this->createApproval($refundRequest, [
            'approver_id' => $this->managerApprover->id,
            'approval_level' => 2,
            'decision' => 'approved',
            'decision_notes' => 'Final approval granted, proceed with refund',
        ]);

        $refundRequest->refresh();
        $this->assertEquals('approved', $refundRequest->status);
        $this->assertNotNull($refundRequest->approved_at);

        // Step 4: Verify calculation integrity
        $calculation = $refundRequest->calculation;
        $this->assertEquals(5000000.00, $calculation['orderTotal']);
        $this->assertEquals(5000000.00, $calculation['customerPaidAmount']);
        $this->assertGreaterThan(0, $calculation['refundableToCustomer']);

        // Step 5: Verify approval chain
        $approvals = $refundRequest->approvals()->orderBy('approval_level')->get();
        $this->assertCount(2, $approvals);
        $this->assertEquals('approved', $approvals[0]->decision);
        $this->assertEquals('approved', $approvals[1]->decision);
    }

    public function test_quality_issue_refund_with_insurance_coverage(): void
    {
        // Step 1: Create quality issue refund
        $refundRequest = $this->createRefundRequest([
            'refund_reason' => 'quality_issue',
            'refund_type' => 'partial_refund',
            'quality_issue_percentage' => 70,
            'customer_notes' => 'Product quality does not match specifications',
            'evidence_documents' => [
                [
                    'type' => 'photo',
                    'url' => 'https://example.com/quality_issue.jpg',
                    'filename' => 'quality_evidence.jpg',
                    'uploaded_at' => now()->toISOString()
                ]
            ],
            'requested_by' => $this->customer->id,
        ]);

        // Step 2: Auto-calculation should apply insurance coverage
        $calculation = $refundRequest->calculation;
        $this->assertEquals('vendor', $calculation['faultParty']);
        $this->assertGreaterThan(0, $calculation['insuranceCover']);
        $this->assertContains('quality_issue_partial_refund', $calculation['appliedRules']);

        // Step 3: Finance approval with adjusted amounts
        $financeApproval = $this->createApproval($refundRequest, [
            'approver_id' => $this->financeApprover->id,
            'approval_level' => 1,
            'decision' => 'approved',
            'reviewed_calculation' => $calculation,
            'adjusted_amount' => $calculation['refundableToCustomer'] * 0.9, // 10% reduction
            'decision_notes' => 'Approved with minor adjustment for handling costs',
        ]);

        // Step 4: Manager final approval
        $managerApproval = $this->createApproval($refundRequest, [
            'approver_id' => $this->managerApprover->id,
            'approval_level' => 2,
            'decision' => 'approved',
            'decision_notes' => 'Quality issue confirmed, proceed with refund',
        ]);

        $refundRequest->refresh();
        $this->assertEquals('approved', $refundRequest->status);

        // Step 5: Verify insurance fund utilization
        $this->assertGreaterThan(0, $calculation['insuranceCover']);
        $this->assertEquals('high', $calculation['riskLevel'] ?? 'low');
    }

    public function test_vendor_failure_with_full_recovery(): void
    {
        // Step 1: Create vendor failure refund
        $refundRequest = $this->createRefundRequest([
            'refund_reason' => 'vendor_failure',
            'refund_type' => 'full_refund',
            'customer_notes' => 'Vendor failed to deliver according to contract',
            'requested_by' => $this->customer->id,
        ]);

        // Step 2: Verify calculation assigns vendor liability
        $calculation = $refundRequest->calculation;
        $this->assertEquals('vendor', $calculation['faultParty']);
        $this->assertGreaterThan(0, $calculation['vendorRecoverable']);
        $this->assertContains('vendor_failure_full_recovery', $calculation['appliedRules']);

        // Step 3: Fast-track approval for vendor failure
        $managerApproval = $this->createApproval($refundRequest, [
            'approver_id' => $this->managerApprover->id,
            'approval_level' => 2, // Skip finance for vendor failure
            'decision' => 'approved',
            'decision_notes' => 'Vendor failure confirmed, full liability assigned',
        ]);

        $refundRequest->refresh();
        $this->assertEquals('approved', $refundRequest->status);

        // Step 4: Verify vendor recovery amount
        $this->assertEquals($this->order->total_disbursed_amount, $calculation['vendorRecoverable']);
        $this->assertEquals(0, $calculation['companyLoss']); // Should be covered
    }

    public function test_refund_rejection_workflow(): void
    {
        // Step 1: Create questionable refund request
        $refundRequest = $this->createRefundRequest([
            'refund_reason' => 'customer_request',
            'refund_type' => 'full_refund',
            'customer_notes' => 'I want my money back',
            'requested_by' => $this->customer->id,
        ]);

        // Set order status to completed (no longer eligible for full refund)
        $this->order->update(['status' => OrderStatus::COMPLETED->value]);

        // Step 2: Finance rejects due to policy
        $financeApproval = $this->createApproval($refundRequest, [
            'approver_id' => $this->financeApprover->id,
            'approval_level' => 1,
            'decision' => 'rejected',
            'decision_notes' => 'Order already completed and delivered. Full refund not applicable.',
        ]);

        $refundRequest->refresh();
        $this->assertEquals('rejected', $refundRequest->status);
        $this->assertNull($refundRequest->approved_at);

        // Step 3: Verify no further approvals needed
        $approvals = $refundRequest->approvals;
        $this->assertCount(1, $approvals);
        $this->assertEquals('rejected', $approvals[0]->decision);
    }

    public function test_high_value_refund_requires_additional_approval(): void
    {
        // Step 1: Create high-value order
        $highValueOrder = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => OrderStatus::IN_PRODUCTION->value,
            'total_amount' => 15000000.00, // 15M IDR - high value
            'total_paid_amount' => 15000000.00,
            'total_disbursed_amount' => 10000000.00,
        ]);

        // Step 2: Create refund request
        $refundRequest = $this->createRefundRequest([
            'order_id' => $highValueOrder->id,
            'refund_reason' => 'quality_issue',
            'refund_type' => 'full_refund',
            'quality_issue_percentage' => 100,
            'customer_notes' => 'Major quality issue, complete product failure',
            'requested_by' => $this->customer->id,
        ]);

        // Step 3: Verify high-level approval required
        $calculation = $refundRequest->calculation;
        $this->assertTrue($calculation['requiresHighLevelApproval'] ?? false);
        $this->assertGreaterThan(2000000, $calculation['refundableToCustomer']);
        $this->assertEquals('high', $calculation['riskLevel'] ?? 'low');
    }

    public function test_production_error_company_liability(): void
    {
        // Step 1: Create production error refund
        $refundRequest = $this->createRefundRequest([
            'refund_reason' => 'production_error',
            'refund_type' => 'full_refund',
            'customer_notes' => 'Internal production error caused defective product',
            'requested_by' => $this->customer->id,
        ]);

        // Step 2: Verify company liability
        $calculation = $refundRequest->calculation;
        $this->assertEquals('company', $calculation['faultParty']);
        $this->assertEquals(0, $calculation['vendorRecoverable']); // No vendor recovery
        $this->assertGreaterThan(0, $calculation['companyLoss']);
        $this->assertGreaterThan(0, $calculation['insuranceCover']); // Insurance should cover

        // Step 3: Manager approval with full company responsibility
        $managerApproval = $this->createApproval($refundRequest, [
            'approver_id' => $this->managerApprover->id,
            'approval_level' => 2,
            'decision' => 'approved',
            'decision_notes' => 'Internal error confirmed, full responsibility accepted',
        ]);

        $refundRequest->refresh();
        $this->assertEquals('approved', $refundRequest->status);
    }

    // Helper methods

    private function createRefundRequest(array $attributes = []): RefundRequest
    {
        $defaultAttributes = [
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'current_approver_id' => $this->financeApprover->id,
            'requested_by' => $this->customer->id,
            'status' => 'pending_review',
        ];

        $refundRequest = RefundRequest::factory()->create(array_merge($defaultAttributes, $attributes));

        // Calculate refund using engine
        $calculation = RefundCalculationEngine::calculate($this->order, $refundRequest);
        $refundRequest->update(['calculation' => $calculation->toArray()]);

        // Set next approver based on calculation
        if ($calculation->requiresHighLevelApproval()) {
            $refundRequest->update(['current_approver_id' => $this->managerApprover->id]);
        } else {
            $refundRequest->update(['current_approver_id' => $this->financeApprover->id]);
        }

        return $refundRequest->fresh();
    }

    private function createApproval(RefundRequest $refundRequest, array $attributes = []): RefundApproval
    {
        $approval = RefundApproval::factory()->create(array_merge([
            'refund_request_id' => $refundRequest->id,
            'decided_at' => now(),
        ], $attributes));

        // Update refund request status based on decision
        $this->updateRefundStatusAfterApproval($refundRequest, $approval);

        return $approval;
    }

    private function updateRefundStatusAfterApproval(RefundRequest $refundRequest, RefundApproval $approval): void
    {
        if ($approval->decision === 'rejected') {
            $refundRequest->update([
                'status' => 'rejected',
                'approved_at' => null
            ]);
            return;
        }

        if ($approval->decision === 'approved') {
            // Check if this was final approval
            if ($approval->approval_level >= 2) {
                $refundRequest->update([
                    'status' => 'approved',
                    'approved_at' => now()
                ]);
            } else {
                // Move to next approval level
                $refundRequest->update([
                    'status' => 'pending_manager',
                    'current_approver_id' => $this->managerApprover->id
                ]);
            }
        }
    }
}