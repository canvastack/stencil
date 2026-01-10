<?php

namespace Database\Factories;

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
        $tenant = TenantEloquentModel::factory();
        $order = Order::factory(['tenant_id' => $tenant]);
        $user = User::factory(['tenant_id' => $tenant]);

        return [
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenant,
            'order_id' => $order,
            'request_number' => 'RFD-' . date('Ymd') . '-' . str_pad($this->faker->unique()->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT),
            'refund_reason' => $this->faker->randomElement([
                'customer_request', 
                'quality_issue', 
                'timeline_delay', 
                'vendor_failure', 
                'production_error', 
                'shipping_damage'
            ]),
            'refund_type' => $this->faker->randomElement([
                'full_refund', 
                'partial_refund', 
                'replacement_order', 
                'credit_note'
            ]),
            'customer_request_amount' => null,
            'quality_issue_percentage' => $this->faker->numberBetween(1, 100),
            'delay_days' => null,
            'evidence_documents' => null,
            'customer_notes' => $this->faker->optional()->sentence(),
            'status' => 'pending_review',
            'current_approver_id' => $user,
            'calculation' => [
                'orderTotal' => 1000000.00,
                'customerPaidAmount' => 1000000.00,
                'vendorCostPaid' => 500000.00,
                'productionProgress' => 50,
                'refundReason' => 'customer_request',
                'faultParty' => 'customer',
                'refundableToCustomer' => 500000.00,
                'companyLoss' => 0,
                'vendorRecoverable' => 0,
                'insuranceCover' => 0,
                'appliedRules' => ['customer_pays_production_cost'],
                'calculatedAt' => now()->toISOString(),
                'calculatedBy' => 'System'
            ],
            'requested_by' => $user,
            'requested_at' => now(),
            'approved_at' => null,
            'processed_at' => null,
        ];
    }

    /**
     * Indicate that the refund request is for customer request.
     */
    public function customerRequest(): static
    {
        return $this->state(fn (array $attributes) => [
            'refund_reason' => 'customer_request',
            'refund_type' => 'full_refund',
        ]);
    }

    /**
     * Indicate that the refund request is for quality issue.
     */
    public function qualityIssue(): static
    {
        return $this->state(fn (array $attributes) => [
            'refund_reason' => 'quality_issue',
            'refund_type' => 'partial_refund',
            'quality_issue_percentage' => $this->faker->numberBetween(50, 100),
        ]);
    }

    /**
     * Indicate that the refund request is for vendor failure.
     */
    public function vendorFailure(): static
    {
        return $this->state(fn (array $attributes) => [
            'refund_reason' => 'vendor_failure',
            'refund_type' => 'full_refund',
        ]);
    }

    /**
     * Indicate that the refund request is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'approved_at' => now(),
        ]);
    }

    /**
     * Indicate that the refund request is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
        ]);
    }
}