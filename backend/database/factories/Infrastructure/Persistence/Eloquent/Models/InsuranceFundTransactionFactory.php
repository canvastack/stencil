<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\InsuranceFundTransaction;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\RefundRequest;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;

class InsuranceFundTransactionFactory extends Factory
{
    protected $model = InsuranceFundTransaction::class;

    public function definition(): array
    {
        $tenantFactory = TenantEloquentModel::factory();
        $amount = $this->faker->randomFloat(2, 10000, 500000);
        $balanceBefore = $this->faker->randomFloat(2, 0, 10000000);
        
        return [
            'id' => $this->faker->uuid(),
            'tenant_id' => $tenantFactory,
            'order_id' => $this->faker->optional(0.8)->passthrough(Order::factory()->for($tenantFactory, 'tenant')),
            'refund_request_id' => $this->faker->optional(0.3)->passthrough(RefundRequest::factory()),
            
            // Transaction Details
            'transaction_type' => $this->faker->randomElement(['contribution', 'withdrawal']),
            'amount' => $amount,
            'description' => $this->faker->sentence(),
            
            // Balance Tracking
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceBefore + ($this->faker->boolean(70) ? $amount : -$amount),
        ];
    }

    /**
     * Indicate that the transaction is a contribution.
     */
    public function contribution(): static
    {
        return $this->state(function (array $attributes) {
            $amount = $this->faker->randomFloat(2, 50000, 150000);
            $balanceBefore = $attributes['balance_before'] ?? $this->faker->randomFloat(2, 0, 10000000);
            
            return [
                'transaction_type' => 'contribution',
                'amount' => $amount,
                'description' => 'Insurance fund contribution from order ' . $this->faker->bothify('ORD-########'),
                'balance_after' => $balanceBefore + $amount,
            ];
        });
    }

    /**
     * Indicate that the transaction is a withdrawal.
     */
    public function withdrawal(): static
    {
        return $this->state(function (array $attributes) {
            $amount = $this->faker->randomFloat(2, 100000, 500000);
            $balanceBefore = $attributes['balance_before'] ?? $this->faker->randomFloat(2, 1000000, 10000000);
            
            return [
                'transaction_type' => 'withdrawal',
                'amount' => $amount,
                'description' => 'Insurance fund withdrawal for refund ' . $this->faker->bothify('RFD-########-#####'),
                'balance_after' => max(0, $balanceBefore - $amount),
                'refund_request_id' => RefundRequest::factory(),
            ];
        });
    }

    /**
     * Indicate that the transaction is from an order contribution.
     */
    public function fromOrder(): static
    {
        return $this->state(function (array $attributes) {
            $orderTotal = $this->faker->randomFloat(2, 1000000, 5000000);
            $contributionRate = 0.025; // 2.5%
            $amount = $orderTotal * $contributionRate;
            $balanceBefore = $attributes['balance_before'] ?? $this->faker->randomFloat(2, 0, 10000000);
            
            return [
                'transaction_type' => 'contribution',
                'amount' => $amount,
                'description' => "Insurance fund contribution from order {$this->faker->bothify('ORD-########')} ({$contributionRate}%)",
                'balance_after' => $balanceBefore + $amount,
                'order_id' => Order::factory(),
                'refund_request_id' => null,
            ];
        });
    }

    /**
     * Indicate that the transaction is for a quality issue withdrawal.
     */
    public function forQualityIssue(): static
    {
        return $this->state(function (array $attributes) {
            $amount = $this->faker->randomFloat(2, 200000, 800000);
            $balanceBefore = $attributes['balance_before'] ?? $this->faker->randomFloat(2, 2000000, 10000000);
            
            return [
                'transaction_type' => 'withdrawal',
                'amount' => $amount,
                'description' => 'Insurance fund withdrawal for quality issue refund',
                'balance_after' => max(0, $balanceBefore - $amount),
                'refund_request_id' => RefundRequest::factory()->qualityIssue(),
            ];
        });
    }

    /**
     * Indicate that the transaction is for vendor failure withdrawal.
     */
    public function forVendorFailure(): static
    {
        return $this->state(function (array $attributes) {
            $amount = $this->faker->randomFloat(2, 500000, 1500000);
            $balanceBefore = $attributes['balance_before'] ?? $this->faker->randomFloat(2, 3000000, 10000000);
            
            return [
                'transaction_type' => 'withdrawal',
                'amount' => $amount,
                'description' => 'Insurance fund withdrawal for vendor failure compensation',
                'balance_after' => max(0, $balanceBefore - $amount),
                'refund_request_id' => RefundRequest::factory()->vendorFailure(),
            ];
        });
    }

    /**
     * Set a specific balance before transaction.
     */
    public function withBalanceBefore(float $balance): static
    {
        return $this->state(fn (array $attributes) => [
            'balance_before' => $balance,
        ]);
    }

    /**
     * Set a specific amount for the transaction.
     */
    public function withAmount(float $amount): static
    {
        return $this->state(function (array $attributes) use ($amount) {
            $balanceBefore = $attributes['balance_before'] ?? $this->faker->randomFloat(2, 0, 10000000);
            $isContribution = ($attributes['transaction_type'] ?? 'contribution') === 'contribution';
            
            return [
                'amount' => $amount,
                'balance_after' => $isContribution ? $balanceBefore + $amount : max(0, $balanceBefore - $amount),
            ];
        });
    }
}