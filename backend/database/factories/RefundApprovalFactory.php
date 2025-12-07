<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\RefundApproval;
use App\Infrastructure\Persistence\Eloquent\Models\RefundRequest;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RefundApprovalFactory extends Factory
{
    protected $model = RefundApproval::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'refund_request_id' => RefundRequest::factory(),
            'approver_id' => User::factory(),
            'approval_level' => $this->faker->numberBetween(1, 3),
            'decision' => $this->faker->randomElement(['approved', 'rejected', 'needs_info']),
            'decision_notes' => $this->faker->optional()->sentence(),
            'decided_at' => now(),
            'reviewed_calculation' => null,
            'adjusted_amount' => null,
        ];
    }

    /**
     * Indicate that the approval is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'decision' => 'approved',
            'decision_notes' => 'Approved after review',
        ]);
    }

    /**
     * Indicate that the approval is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'decision' => 'rejected',
            'decision_notes' => 'Rejected due to policy violation',
        ]);
    }

    /**
     * Indicate that the approval needs more information.
     */
    public function needsInfo(): static
    {
        return $this->state(fn (array $attributes) => [
            'decision' => 'needs_info',
            'decision_notes' => 'Additional documentation required',
        ]);
    }

    /**
     * Indicate this is a finance level approval.
     */
    public function financeLevel(): static
    {
        return $this->state(fn (array $attributes) => [
            'approval_level' => 1,
        ]);
    }

    /**
     * Indicate this is a manager level approval.
     */
    public function managerLevel(): static
    {
        return $this->state(fn (array $attributes) => [
            'approval_level' => 2,
        ]);
    }

    /**
     * Indicate this is an executive level approval.
     */
    public function executiveLevel(): static
    {
        return $this->state(fn (array $attributes) => [
            'approval_level' => 3,
        ]);
    }
}