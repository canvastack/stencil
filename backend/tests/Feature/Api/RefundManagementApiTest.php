<?php

namespace Tests\Feature\Api;

use App\Infrastructure\Persistence\Eloquent\Models\{
    Order, 
    RefundRequest, 
    RefundApproval, 
    User
};
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Domain\Order\Enums\OrderStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Feature Test for Refund Management API Endpoints
 * 
 * Tests all REST API endpoints for refund system including:
 * - CRUD operations for refund requests
 * - Approval workflow endpoints
 * - Search and filtering
 * - Authentication and authorization
 * - API response formats
 */
class RefundManagementApiTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private TenantEloquentModel $tenant;
    private User $user;
    private User $approver;
    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup test environment
        $this->tenant = TenantEloquentModel::factory()->create();
        
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id
        ]);
        
        $this->approver = User::factory()->create([
            'tenant_id' => $this->tenant->id
        ]);

        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => OrderStatus::IN_PRODUCTION->value,
            'total_amount' => 3000000.00,
            'total_paid_amount' => 3000000.00,
            'total_disbursed_amount' => 2000000.00,
        ]);

        // Authenticate as user for tests
        Sanctum::actingAs($this->user);
        
        // Set tenant context for multi-tenancy
        app()->instance('current_tenant', $this->tenant);
        config(['multitenancy.current_tenant' => $this->tenant]);
    }

    /**
     * Remove authentication for testing unauthorized access
     */
    protected function withoutAuthentication(): void
    {
        $this->app['auth']->forgetGuards();
    }

    // === CREATE REFUND REQUEST ENDPOINTS ===

    public function test_create_refund_request_success(): void
    {
        $payload = [
            'order_id' => $this->order->id,
            'refund_reason' => 'customer_request',
            'refund_type' => 'full_refund',
            'customer_notes' => 'Changed mind about the order',
            'customer_request_amount' => 3000000.00,
        ];

        $response = $this->postJson('/api/v1/refunds', $payload);

        $response
            ->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'request_number',
                    'order_id',
                    'refund_reason',
                    'refund_type',
                    'customer_notes',
                    'status',
                    'calculation' => [
                        'orderTotal',
                        'refundableToCustomer',
                        'companyLoss',
                        'faultParty'
                    ],
                    'created_at'
                ],
                'message'
            ])
            ->assertJson([
                'data' => [
                    'refund_reason' => 'customer_request',
                    'refund_type' => 'full_refund',
                    'status' => 'pending_finance'
                ]
            ]);

        $this->assertDatabaseHas('refund_requests', [
            'order_id' => $this->order->id,
            'refund_reason' => 'customer_request',
            'requested_by' => $this->user->id
        ]);
    }

    public function test_create_quality_issue_refund(): void
    {
        $payload = [
            'order_id' => $this->order->id,
            'refund_reason' => 'quality_issue',
            'refund_type' => 'partial_refund',
            'quality_issue_percentage' => 70,
            'customer_notes' => 'Product quality does not match specifications',
            'evidence_documents' => [
                [
                    'type' => 'photo',
                    'url' => 'https://example.com/evidence.jpg',
                    'filename' => 'quality_issue.jpg'
                ]
            ]
        ];

        $response = $this->postJson('/api/v1/refunds', $payload);

        $response
            ->assertStatus(201)
            ->assertJsonPath('data.refund_reason', 'quality_issue')
            ->assertJsonPath('data.quality_issue_percentage', 70)
            ->assertJsonPath('data.calculation.faultParty', 'vendor');
    }

    public function test_create_refund_request_validation_errors(): void
    {
        $response = $this->postJson('/api/v1/refunds', [
            // Missing required fields
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['order_id', 'refund_reason', 'refund_type']);
    }

    public function test_create_refund_unauthorized(): void
    {
        // Test without authentication by not calling Sanctum::actingAs()
        $this->withoutAuthentication();

        $response = $this->postJson('/api/v1/refunds', [
            'order_id' => $this->order->id,
            'refund_reason' => 'customer_request'
        ]);

        $response->assertStatus(401);
    }

    // === GET REFUND REQUESTS ENDPOINTS ===

    public function test_list_refund_requests(): void
    {
        // Create test refund requests
        RefundRequest::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'requested_by' => $this->user->id
        ]);

        $response = $this->getJson('/api/v1/refunds');

        $response
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'request_number',
                        'refund_reason',
                        'status',
                        'order' => [
                            'id',
                            'order_number',
                            'total_amount'
                        ],
                        'created_at'
                    ]
                ],
                'meta' => [
                    'current_page',
                    'per_page',
                    'total'
                ]
            ]);

        $this->assertGreaterThanOrEqual(3, $response->json('meta.total'));
    }

    public function test_list_refunds_with_filters(): void
    {
        // Create different types of refunds
        RefundRequest::factory()->create([
            'tenant_id' => $this->tenant->id,
            'refund_reason' => 'quality_issue',
            'status' => 'pending_review'
        ]);
        
        RefundRequest::factory()->create([
            'tenant_id' => $this->tenant->id,
            'refund_reason' => 'customer_request',
            'status' => 'approved'
        ]);

        // Filter by status
        $response = $this->getJson('/api/v1/refunds?status=pending_review');
        $response->assertStatus(200);
        
        $pendingRefunds = collect($response->json('data'));
        $this->assertTrue($pendingRefunds->every(fn($refund) => $refund['status'] === 'pending_review'));

        // Filter by reason
        $response = $this->getJson('/api/v1/refunds?refund_reason=quality_issue');
        $response->assertStatus(200);
        
        $qualityRefunds = collect($response->json('data'));
        $this->assertTrue($qualityRefunds->every(fn($refund) => $refund['refund_reason'] === 'quality_issue'));
    }

    public function test_search_refunds(): void
    {
        $refund = RefundRequest::factory()->create([
            'tenant_id' => $this->tenant->id,
            'request_number' => 'RFD-20241207-12345',
            'customer_notes' => 'Special customer issue'
        ]);

        // Search by request number
        $response = $this->getJson('/api/v1/refunds?search=RFD-20241207-12345');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));

        // Search by notes
        $response = $this->getJson('/api/v1/refunds?search=Special+customer');
        $response->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($response->json('data')));
    }

    // === INDIVIDUAL REFUND REQUEST ENDPOINTS ===

    public function test_get_refund_request_details(): void
    {
        $refund = RefundRequest::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id
        ]);

        $response = $this->getJson("/api/v1/refunds/{$refund->request_number}");

        $response
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'request_number',
                    'order',
                    'refund_reason',
                    'refund_type',
                    'calculation',
                    'approvals' => [
                        '*' => [
                            'id',
                            'approver_id',
                            'approval_level',
                            'decision',
                            'decision_notes',
                            'decided_at'
                        ]
                    ],
                    'timeline' => [
                        '*' => [
                            'action',
                            'user',
                            'timestamp',
                            'notes'
                        ]
                    ]
                ]
            ]);
    }

    public function test_get_nonexistent_refund_request(): void
    {
        $response = $this->getJson('/api/v1/refunds/RFD-NONEXISTENT');
        $response->assertStatus(404);
    }

    // === UPDATE REFUND REQUEST ENDPOINTS ===

    public function test_update_refund_request(): void
    {
        $refund = RefundRequest::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'pending_review',
            'customer_notes' => 'Original notes'
        ]);

        $payload = [
            'customer_notes' => 'Updated customer notes',
            'evidence_documents' => [
                [
                    'type' => 'photo',
                    'url' => 'https://example.com/updated_evidence.jpg',
                    'filename' => 'updated_evidence.jpg'
                ]
            ]
        ];

        $response = $this->putJson("/api/v1/refunds/{$refund->request_number}", $payload);

        $response
            ->assertStatus(200)
            ->assertJsonPath('data.customer_notes', 'Updated customer notes');

        $this->assertDatabaseHas('refund_requests', [
            'id' => $refund->id,
            'customer_notes' => 'Updated customer notes'
        ]);
    }

    public function test_cannot_update_approved_refund(): void
    {
        $refund = RefundRequest::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'approved'
        ]);

        $response = $this->putJson("/api/v1/refunds/{$refund->request_number}", [
            'customer_notes' => 'Should not be allowed'
        ]);

        $response->assertStatus(422)
                ->assertJsonPath('message', 'Cannot update refund request in current status');
    }

    // === APPROVAL WORKFLOW ENDPOINTS ===

    public function test_submit_approval_decision(): void
    {
        Sanctum::actingAs($this->approver);

        $refund = RefundRequest::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'pending_finance',
            'current_approver_id' => $this->approver->id
        ]);

        $payload = [
            'decision' => 'approved',
            'decision_notes' => 'Financial review completed successfully',
            'approval_level' => 1
        ];

        $response = $this->postJson("/api/v1/refunds/{$refund->request_number}/approve", $payload);

        $response
            ->assertStatus(200)
            ->assertJsonPath('data.decision', 'approved')
            ->assertJsonPath('data.approval_level', 1);

        $this->assertDatabaseHas('refund_approvals', [
            'refund_request_id' => $refund->id,
            'approver_id' => $this->approver->id,
            'decision' => 'approved'
        ]);
    }

    public function test_reject_refund_request(): void
    {
        Sanctum::actingAs($this->approver);

        $refund = RefundRequest::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'pending_review',
            'current_approver_id' => $this->approver->id
        ]);

        $payload = [
            'decision' => 'rejected',
            'decision_notes' => 'Insufficient evidence provided',
            'approval_level' => 1
        ];

        $response = $this->postJson("/api/v1/refunds/{$refund->request_number}/approve", $payload);

        $response->assertStatus(200);

        // Check refund status updated
        $refund->refresh();
        $this->assertEquals('rejected', $refund->status);
    }

    public function test_unauthorized_approval(): void
    {
        $refund = RefundRequest::factory()->create([
            'tenant_id' => $this->tenant->id,
            'current_approver_id' => $this->approver->id
        ]);

        // User tries to approve (not the assigned approver)
        $response = $this->postJson("/api/v1/refunds/{$refund->request_number}/approve", [
            'decision' => 'approved'
        ]);

        $response->assertStatus(403)
                ->assertJsonPath('message', 'Not authorized to approve this refund request');
    }

    // === APPROVAL HISTORY ENDPOINTS ===

    public function test_get_approval_history(): void
    {
        $refund = RefundRequest::factory()->create([
            'tenant_id' => $this->tenant->id
        ]);

        // Create approval history
        RefundApproval::factory()->count(2)->create([
            'refund_request_id' => $refund->id
        ]);

        $response = $this->getJson("/api/v1/refunds/{$refund->request_number}/approvals");

        $response
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'approver',
                        'approval_level',
                        'decision',
                        'decision_notes',
                        'decided_at'
                    ]
                ]
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    // === REFUND STATISTICS ENDPOINTS ===

    public function test_get_refund_statistics(): void
    {
        // Create various refund requests for statistics
        RefundRequest::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'pending_review'
        ]);
        
        RefundRequest::factory()->count(1)->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'approved'
        ]);

        $response = $this->getJson('/api/v1/refunds/statistics');

        $response
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'total_requests',
                    'pending_requests',
                    'approved_requests',
                    'rejected_requests',
                    'total_refund_amount',
                    'by_reason' => [
                        '*' => ['reason', 'count']
                    ],
                    'by_status' => [
                        '*' => ['status', 'count']
                    ],
                    'monthly_trend' => [
                        '*' => ['month', 'count', 'amount']
                    ]
                ]
            ])
            ->assertJsonPath('data.total_requests', 3)
            ->assertJsonPath('data.pending_requests', 2)
            ->assertJsonPath('data.approved_requests', 1);
    }

    // === ERROR HANDLING TESTS ===

    public function test_invalid_order_id(): void
    {
        $response = $this->postJson('/api/v1/refunds', [
            'order_id' => 99999, // Non-existent order
            'refund_reason' => 'customer_request',
            'refund_type' => 'full_refund'
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['order_id']);
    }

    public function test_order_not_eligible_for_refund(): void
    {
        $completedOrder = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => OrderStatus::COMPLETED->value,
            // Order completed more than 30 days ago
            'updated_at' => now()->subDays(31)
        ]);

        $response = $this->postJson('/api/v1/refunds', [
            'order_id' => $completedOrder->id,
            'refund_reason' => 'customer_request',
            'refund_type' => 'full_refund'
        ]);

        $response->assertStatus(422)
                ->assertJsonPath('message', 'Order is not eligible for refund');
    }

    public function test_duplicate_refund_request(): void
    {
        // Create existing refund request
        RefundRequest::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'status' => 'pending_review'
        ]);

        // Try to create another refund for same order
        $response = $this->postJson('/api/v1/refunds', [
            'order_id' => $this->order->id,
            'refund_reason' => 'quality_issue',
            'refund_type' => 'full_refund'
        ]);

        $response->assertStatus(422)
                ->assertJsonPath('message', 'Active refund request already exists for this order');
    }

    // === PAGINATION AND SORTING TESTS ===

    public function test_refunds_pagination(): void
    {
        RefundRequest::factory()->count(25)->create([
            'tenant_id' => $this->tenant->id
        ]);

        $response = $this->getJson('/api/v1/refunds?per_page=10&page=2');

        $response
            ->assertStatus(200)
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', 10);

        $this->assertCount(10, $response->json('data'));
    }

    public function test_refunds_sorting(): void
    {
        RefundRequest::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_at' => now()->subDays(2)
        ]);
        
        RefundRequest::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_at' => now()->subDays(1)
        ]);

        // Sort by created_at desc (newest first)
        $response = $this->getJson('/api/v1/refunds?sort=created_at&order=desc');

        $response->assertStatus(200);
        
        $data = $response->json('data');
        $this->assertGreaterThan(
            strtotime($data[1]['created_at']),
            strtotime($data[0]['created_at'])
        );
    }
}