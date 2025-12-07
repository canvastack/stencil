<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\RefundApproval;
use App\Infrastructure\Persistence\Eloquent\Models\RefundRequest;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RefundApprovalFactory extends Factory
{
    protected $model = RefundApproval::class;

    public function definition(): array
    {
        return [
            'id' => $this->faker->uuid(),
            'refund_request_id' => RefundRequest::factory(),
            'approver_id' => User::factory(),
            'approval_level' => $this->faker->numberBetween(1, 3),
            
            // Decision
            'decision' => $this->faker->randomElement(['approved', 'rejected', 'needs_info']),
            'decision_notes' => $this->faker->optional(0.8)->paragraph(),
            'decided_at' => $this->faker->dateTimeBetween('-1 week', 'now'),
            
            // Financial Review (for finance level)
            'reviewed_calculation' => $this->faker->optional(0.3)->randomElements([
                'orderTotal' => $this->faker->randomFloat(2, 100000, 5000000),
                'refundableToCustomer' => $this->faker->randomFloat(2, 50000, 3000000),
                'vendorRecoverable' => $this->faker->randomFloat(2, 0, 2000000),
                'companyLoss' => $this->faker->randomFloat(2, 0, 1000000),
            ]),
            'adjusted_amount' => $this->faker->optional(0.2)->randomFloat(2, 50000, 2000000),
        ];
    }

    /**
     * Indicate that the approval was approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'decision' => 'approved',
            'decision_notes' => $this->faker->randomElement([
                'Financial review completed successfully',
                'All calculations verified and approved',
                'Documentation is complete, proceed with refund',
                'Refund justified, approved for processing'
            ]),
        ]);
    }

    /**
     * Indicate that the approval was rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'decision' => 'rejected',
            'decision_notes' => $this->faker->randomElement([
                'Insufficient evidence provided',
                'Refund does not meet policy criteria',
                'Order already completed beyond refund window',
                'Documentation incomplete or invalid'
            ]),
        ]);
    }

    /**
     * Indicate that the approval needs more information.
     */
    public function needsInfo(): static
    {
        return $this->state(fn (array $attributes) => [
            'decision' => 'needs_info',
            'decision_notes' => $this->faker->randomElement([
                'Additional documentation required',
                'Need clarification on quality issue details',
                'Vendor communication needed before approval',
                'Customer needs to provide more evidence'
            ]),
        ]);
    }

    /**
     * Indicate that this is a finance-level approval.
     */
    public function financeLevel(): static
    {
        return $this->state(fn (array $attributes) => [
            'approval_level' => 1,
            'reviewed_calculation' => [
                'orderTotal' => $this->faker->randomFloat(2, 100000, 5000000),
                'refundableToCustomer' => $this->faker->randomFloat(2, 50000, 3000000),
                'vendorRecoverable' => $this->faker->randomFloat(2, 0, 2000000),
                'companyLoss' => $this->faker->randomFloat(2, 0, 1000000),
                'riskLevel' => $this->faker->randomElement(['low', 'medium', 'high']),
            ],
            'adjusted_amount' => $this->faker->optional(0.4)->randomFloat(2, 50000, 2000000),
            'decision_notes' => 'Financial calculations reviewed and verified',
        ]);
    }

    /**
     * Indicate that this is a manager-level approval.
     */
    public function managerLevel(): static
    {
        return $this->state(fn (array $attributes) => [
            'approval_level' => 2,
            'reviewed_calculation' => null,
            'adjusted_amount' => null,
            'decision_notes' => $this->faker->randomElement([
                'Final approval granted for refund processing',
                'Management review completed, proceed',
                'Strategic review complete, approved',
                'Executive approval for high-value refund'
            ]),
        ]);
    }

    /**
     * Indicate that this is an executive-level approval.
     */
    public function executiveLevel(): static
    {
        return $this->state(fn (array $attributes) => [
            'approval_level' => 3,
            'reviewed_calculation' => null,
            'adjusted_amount' => null,
            'decision_notes' => $this->faker->randomElement([
                'Executive approval for critical refund',
                'Board-level review completed',
                'Strategic impact assessed, approved',
                'High-value refund executive approval'
            ]),
        ]);
    }

    /**
     * Set specific approval level.
     */
    public function level(int $level): static
    {
        return $this->state(fn (array $attributes) => [
            'approval_level' => $level,
        ]);
    }

    /**
     * Set specific decision with custom notes.
     */
    public function withDecision(string $decision, string $notes = null): static
    {
        return $this->state(fn (array $attributes) => [
            'decision' => $decision,
            'decision_notes' => $notes ?? $this->faker->sentence(),
        ]);
    }
}