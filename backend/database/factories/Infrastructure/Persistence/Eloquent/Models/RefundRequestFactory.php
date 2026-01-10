<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\RefundRequest;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RefundRequestFactory extends Factory
{
    protected $model = RefundRequest::class;

    public function definition(): array
    {
        $tenantFactory = TenantEloquentModel::factory();
        $orderFactory = Order::factory()->for($tenantFactory, 'tenant');
        $userFactory = User::factory()->for($tenantFactory, 'tenant');

        return [
            'id' => $this->faker->uuid(),
            'tenant_id' => $tenantFactory,
            'order_id' => $orderFactory,
            'request_number' => 'RFD-' . date('Ymd') . '-' . str_pad($this->faker->unique()->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT),
            
            // Request Details
            'refund_reason' => $this->faker->randomElement([
                'customer_request',
                'quality_issue', 
                'vendor_failure',
                'timeline_delay',
                'production_error',
                'shipping_damage'
            ]),
            'refund_type' => $this->faker->randomElement([
                'full_refund',
                'partial_refund', 
                'replacement_order',
                'credit_note'
            ]),
            'customer_request_amount' => $this->faker->optional(0.7)->randomFloat(2, 100000, 5000000),
            'evidence_documents' => $this->faker->optional(0.8)->randomElements([
                [
                    'type' => 'photo',
                    'url' => 'https://example.com/evidence/' . $this->faker->uuid() . '.jpg',
                    'filename' => 'quality_issue_' . $this->faker->uuid() . '.jpg',
                    'uploaded_at' => $this->faker->dateTimeBetween('-1 week', 'now')->format('c')
                ],
                [
                    'type' => 'document', 
                    'url' => 'https://example.com/evidence/' . $this->faker->uuid() . '.pdf',
                    'filename' => 'vendor_contract_' . $this->faker->uuid() . '.pdf',
                    'uploaded_at' => $this->faker->dateTimeBetween('-1 week', 'now')->format('c')
                ]
            ], $this->faker->numberBetween(0, 2)),
            'customer_notes' => $this->faker->optional(0.9)->paragraph(),
            
            // Status & Workflow
            'status' => $this->faker->randomElement([
                'pending_review',
                'under_investigation', 
                'pending_finance',
                'pending_manager',
                'approved',
                'processing',
                'completed',
                'rejected'
            ]),
            'current_approver_id' => $this->faker->optional(0.5)->passthrough($userFactory),
            
            // Financial Calculation (placeholder - akan diisi oleh RefundCalculationEngine)
            'calculation' => [
                'orderTotal' => $this->faker->randomFloat(2, 100000, 5000000),
                'customerPaidAmount' => $this->faker->randomFloat(2, 100000, 5000000),
                'vendorCostPaid' => $this->faker->randomFloat(2, 0, 2000000),
                'productionProgress' => $this->faker->numberBetween(0, 100),
                'refundReason' => 'customer_request',
                'qualityIssuePercentage' => 100,
                'calculatedAt' => now(),
                'calculatedBy' => 'System'
            ],
            
            // Audit fields
            'requested_by' => $userFactory,
            'requested_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'approved_at' => $this->faker->optional(0.3)->dateTimeBetween('-1 week', 'now'),
            'processed_at' => $this->faker->optional(0.2)->dateTimeBetween('-3 days', 'now'),
        ];
    }

    /**
     * Indicate that the refund is for a customer-initiated request.
     */
    public function customerInitiated(): static
    {
        return $this->state(fn (array $attributes) => [
            'refund_reason' => 'customer_request',
            'refund_type' => 'full_refund',
            'customer_notes' => 'Customer changed mind about the order',
        ]);
    }

    /**
     * Indicate that the refund is for a quality issue.
     */
    public function qualityIssue(): static
    {
        return $this->state(fn (array $attributes) => [
            'refund_reason' => 'quality_issue',
            'refund_type' => 'partial_refund',
            'customer_notes' => 'Product quality does not match specifications',
            'evidence_documents' => [
                [
                    'type' => 'photo',
                    'url' => 'https://example.com/evidence/quality_issue.jpg',
                    'filename' => 'quality_issue_evidence.jpg',
                    'uploaded_at' => now()->subDays(2)->toISOString()
                ]
            ],
        ]);
    }

    /**
     * Indicate that the refund is for vendor failure.
     */
    public function vendorFailure(): static
    {
        return $this->state(fn (array $attributes) => [
            'refund_reason' => 'vendor_failure',
            'refund_type' => 'full_refund',
            'customer_notes' => 'Vendor failed to deliver according to contract',
        ]);
    }

    /**
     * Indicate that the refund is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'approved_at' => $this->faker->dateTimeBetween('-1 week', 'now'),
        ]);
    }

    /**
     * Indicate that the refund is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'approved_at' => $this->faker->dateTimeBetween('-1 week', '-3 days'),
            'processed_at' => $this->faker->dateTimeBetween('-3 days', 'now'),
        ]);
    }

    /**
     * Indicate that the refund is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'customer_notes' => 'Request does not meet refund criteria',
        ]);
    }
}