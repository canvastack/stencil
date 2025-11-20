<?php

namespace Database\Factories;

use App\Models\PaymentRefund;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\OrderEloquentModel;
use App\Infrastructure\Persistence\Eloquent\CustomerEloquentModel;
use App\Infrastructure\Persistence\Eloquent\VendorEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PaymentRefundFactory extends Factory
{
    protected $model = PaymentRefund::class;

    public function definition(): array
    {
        $refundAmount = $this->faker->numberBetween(50000, 500000); // IDR 500 - 5,000
        $originalAmount = $refundAmount + $this->faker->numberBetween(0, 100000); // Original is >= refund amount
        $feeAmount = $this->faker->numberBetween(0, $refundAmount * 0.1); // Fee up to 10%

        return [
            'tenant_id' => TenantEloquentModel::factory(),
            'order_id' => OrderEloquentModel::factory(),
            'original_transaction_id' => 1, // Will be set by relationship
            'customer_id' => CustomerEloquentModel::factory(),
            'vendor_id' => $this->faker->optional(0.7)->randomElement([
                VendorEloquentModel::factory(),
                null
            ]),
            
            // Refund identification
            'refund_reference' => 'REF-' . strtoupper(Str::random(10)),
            'gateway_refund_id' => $this->faker->optional(0.8)->uuid(),
            
            // Refund details
            'type' => $this->faker->randomElement(['full', 'partial']),
            'status' => $this->faker->randomElement(['pending', 'processing', 'approved', 'rejected', 'completed', 'failed']),
            'refund_amount' => $refundAmount,
            'original_amount' => $originalAmount,
            'currency' => 'IDR',
            
            // Refund method and details
            'refund_method' => $this->faker->randomElement(['original_method', 'bank_transfer', 'cash', 'store_credit', 'manual']),
            'refund_details' => function (array $attributes) {
                switch ($attributes['refund_method']) {
                    case 'bank_transfer':
                        return [
                            'bank_name' => $this->faker->randomElement(['BCA', 'Mandiri', 'BNI', 'BRI']),
                            'account_number' => $this->faker->bankAccountNumber(),
                            'account_holder' => $this->faker->name(),
                        ];
                    case 'original_method':
                        return [
                            'original_payment_method' => 'credit_card',
                            'card_last_four' => $this->faker->numerify('****-****-****-####'),
                        ];
                    default:
                        return null;
                }
            },
            
            // Business reasons and notes
            'reason_category' => $this->faker->randomElement([
                'customer_request', 'order_cancellation', 'product_defect', 
                'shipping_issue', 'duplicate_payment', 'fraud', 'other'
            ]),
            'reason' => $this->faker->sentence(10),
            'internal_notes' => $this->faker->optional(0.6)->paragraph(),
            'supporting_documents' => $this->faker->optional(0.3)->randomElements([
                '/uploads/refunds/receipt_001.pdf',
                '/uploads/refunds/photo_defect.jpg',
                '/uploads/refunds/customer_complaint.pdf'
            ], $this->faker->numberBetween(1, 2)),
            
            // Approval workflow - simple default
            'approval_workflow' => null,
            'initiated_by' => UserEloquentModel::factory(),
            'approved_by' => $this->faker->optional(0.5)->randomElement([
                UserEloquentModel::factory(),
                null
            ]),
            'processed_by' => $this->faker->optional(0.3)->randomElement([
                UserEloquentModel::factory(),
                null
            ]),
            
            // Important timestamps
            'requested_at' => $requestedAt = $this->faker->dateTimeBetween('-30 days', 'now'),
            'approved_at' => function (array $attributes) use ($requestedAt) {
                return in_array($attributes['status'], ['approved', 'completed']) 
                    ? $this->faker->dateTimeBetween($requestedAt, 'now')
                    : null;
            },
            'rejected_at' => function (array $attributes) use ($requestedAt) {
                return $attributes['status'] === 'rejected'
                    ? $this->faker->dateTimeBetween($requestedAt, 'now')
                    : null;
            },
            'processed_at' => function (array $attributes) use ($requestedAt) {
                return in_array($attributes['status'], ['processing', 'completed'])
                    ? $this->faker->dateTimeBetween($requestedAt, 'now')
                    : null;
            },
            'completed_at' => function (array $attributes) use ($requestedAt) {
                return $attributes['status'] === 'completed'
                    ? $this->faker->dateTimeBetween($requestedAt, 'now')
                    : null;
            },
            
            // Gateway integration
            'gateway_response' => function (array $attributes) {
                return $attributes['status'] === 'completed' ? [
                    'transaction_id' => $this->faker->uuid(),
                    'status' => 'success',
                    'message' => 'Refund processed successfully',
                    'processed_at' => now()->toISOString()
                ] : null;
            },
            'gateway_error_code' => function (array $attributes) {
                return $attributes['status'] === 'failed' ? $this->faker->randomElement([
                    'INSUFFICIENT_FUNDS', 'INVALID_ACCOUNT', 'NETWORK_ERROR'
                ]) : null;
            },
            'gateway_error_message' => function (array $attributes) {
                return $attributes['status'] === 'failed' 
                    ? $this->faker->sentence()
                    : null;
            },
            
            // Financial tracking
            'fee_amount' => $feeAmount,
            
            // Business intelligence
            'is_disputed' => $this->faker->boolean(10), // 10% chance
            'affects_vendor_payment' => $this->faker->boolean(60), // 60% chance
            'impact_analysis' => $this->faker->optional(0.3)->randomElements([
                'vendor_payment_adjustment' => $this->faker->numberBetween(10000, 100000),
                'customer_satisfaction_impact' => $this->faker->randomElement(['positive', 'neutral', 'negative']),
                'repeat_customer_risk' => $this->faker->randomElement(['low', 'medium', 'high'])
            ], $this->faker->numberBetween(1, 3))
        ];
    }

    /**
     * Configure the model factory for pending refunds
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'approved_at' => null,
            'rejected_at' => null,
            'processed_at' => null,
            'completed_at' => null,
            'gateway_response' => null,
        ]);
    }

    /**
     * Configure the model factory for approved refunds
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'approved_by' => UserEloquentModel::factory(),
            'approved_at' => $this->faker->dateTimeBetween($attributes['requested_at'], 'now'),
            'rejected_at' => null,
        ]);
    }

    /**
     * Configure the model factory for completed refunds
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'approved_by' => UserEloquentModel::factory(),
            'processed_by' => UserEloquentModel::factory(),
            'approved_at' => $approvedAt = $this->faker->dateTimeBetween($attributes['requested_at'], 'now'),
            'processed_at' => $processedAt = $this->faker->dateTimeBetween($approvedAt, 'now'),
            'completed_at' => $this->faker->dateTimeBetween($processedAt, 'now'),
            'gateway_response' => [
                'transaction_id' => $this->faker->uuid(),
                'status' => 'success',
                'message' => 'Refund processed successfully',
                'processed_at' => now()->toISOString()
            ],
        ]);
    }

    /**
     * Configure the model factory for rejected refunds
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'approved_by' => UserEloquentModel::factory(),
            'rejected_at' => $this->faker->dateTimeBetween($attributes['requested_at'], 'now'),
            'approved_at' => null,
            'processed_at' => null,
            'completed_at' => null,
        ]);
    }

    /**
     * Configure the model factory for failed refunds
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'approved_by' => UserEloquentModel::factory(),
            'processed_by' => UserEloquentModel::factory(),
            'approved_at' => $approvedAt = $this->faker->dateTimeBetween($attributes['requested_at'], 'now'),
            'processed_at' => $this->faker->dateTimeBetween($approvedAt, 'now'),
            'gateway_error_code' => $this->faker->randomElement(['INSUFFICIENT_FUNDS', 'INVALID_ACCOUNT', 'NETWORK_ERROR']),
            'gateway_error_message' => $this->faker->sentence(),
        ]);
    }

    /**
     * Configure the model factory for full refunds
     */
    public function fullRefund(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'full',
            'refund_amount' => $attributes['original_amount'],
        ]);
    }

    /**
     * Configure the model factory for partial refunds
     */
    public function partialRefund(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'partial',
            'refund_amount' => $this->faker->numberBetween(
                intval($attributes['original_amount'] * 0.1), 
                intval($attributes['original_amount'] * 0.9)
            ),
        ]);
    }

    /**
     * Configure the model factory for disputed refunds
     */
    public function disputed(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_disputed' => true,
            'reason_category' => $this->faker->randomElement(['fraud', 'product_defect', 'other']),
            'internal_notes' => 'This refund is under dispute. ' . $this->faker->paragraph(),
        ]);
    }

    /**
     * Configure the model factory for bank transfer refunds
     */
    public function bankTransfer(): static
    {
        return $this->state(fn (array $attributes) => [
            'refund_method' => 'bank_transfer',
            'refund_details' => [
                'bank_name' => $this->faker->randomElement(['BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga']),
                'account_number' => $this->faker->numerify('#############'),
                'account_holder' => $this->faker->name(),
                'routing_number' => $this->faker->optional()->numerify('###-####-###'),
            ],
        ]);
    }
}