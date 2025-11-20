<?php

namespace Database\Factories;

use App\Models\RefundApprovalWorkflow;
use App\Models\PaymentRefund;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\OrderEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\RoleEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;

class RefundApprovalWorkflowFactory extends Factory
{
    protected $model = RefundApprovalWorkflow::class;

    public function definition(): array
    {
        $stepNumber = $this->faker->numberBetween(1, 3);
        $totalSteps = $this->faker->numberBetween($stepNumber, 3);
        $slaHours = $this->faker->randomElement([24, 48, 72]);

        return [
            'tenant_id' => TenantEloquentModel::factory(),
            'payment_refund_id' => PaymentRefund::factory(),
            'order_id' => OrderEloquentModel::factory(),
            
            // Workflow configuration
            'workflow_name' => $this->faker->randomElement([
                'standard_refund_approval',
                'high_value_refund_approval',
                'dispute_refund_approval',
                'automatic_refund_approval'
            ]),
            'step_number' => $stepNumber,
            'total_steps' => $totalSteps,
            'is_current_step' => $stepNumber === 1, // First step is usually current
            'is_completed' => false,
            
            // Step details
            'step_name' => function (array $attributes) {
                return match ($attributes['step_number']) {
                    1 => $this->faker->randomElement(['initial_review', 'manager_approval', 'customer_service_review']),
                    2 => $this->faker->randomElement(['finance_approval', 'senior_manager_approval', 'fraud_check']),
                    3 => $this->faker->randomElement(['final_approval', 'cfo_approval', 'executive_approval']),
                    default => 'additional_review',
                };
            },
            'step_description' => function (array $attributes) {
                $stepNames = [
                    'initial_review' => 'Initial review of refund request and documentation',
                    'manager_approval' => 'Manager review and approval of refund terms',
                    'customer_service_review' => 'Customer service team verification',
                    'finance_approval' => 'Finance team approval for payment processing',
                    'senior_manager_approval' => 'Senior management approval for high-value refunds',
                    'fraud_check' => 'Fraud detection and verification process',
                    'final_approval' => 'Final approval before processing',
                    'cfo_approval' => 'CFO approval for large refunds',
                    'executive_approval' => 'Executive level approval',
                ];
                return $stepNames[$attributes['step_name']] ?? 'Standard approval step';
            },
            'step_type' => $this->faker->randomElement(['approval', 'review', 'notification', 'processing']),
            'approval_level' => function (array $attributes) {
                return match ($attributes['step_number']) {
                    1 => 'low',
                    2 => 'medium',
                    3 => 'high',
                    default => 'critical',
                };
            },
            
            // Assigned approver
            'assigned_to' => UserEloquentModel::factory(),
            'role_required' => $this->faker->optional(0.7)->randomElement([
                RoleEloquentModel::factory(),
                null
            ]),
            'permission_requirements' => $this->faker->optional(0.5)->randomElements([
                'refund.approve',
                'refund.review',
                'finance.approve',
                'manager.approve'
            ], $this->faker->numberBetween(1, 2)),
            
            // Approval decision
            'decision' => 'pending',
            'decision_reason' => null,
            'decision_metadata' => null,
            
            // Decision maker (will be filled when decision is made)
            'decided_by' => null,
            'decided_at' => null,
            'decision_ip_address' => null,
            'decision_user_agent' => null,
            
            // Timing and SLA
            'assigned_at' => $assignedAt = $this->faker->dateTimeBetween('-5 days', 'now'),
            'due_at' => (clone $assignedAt)->modify("+{$slaHours} hours"),
            'sla_hours' => $slaHours,
            'is_overdue' => false,
            'sla_breached' => false,
            
            // Escalation
            'can_be_escalated' => $this->faker->boolean(80),
            'escalated_to' => null,
            'escalated_at' => null,
            'escalation_reason' => null,
            
            // Conditions and rules
            'approval_conditions' => $this->faker->optional(0.6)->randomElements([
                'refund_amount_limit' => $this->faker->numberBetween(100000, 1000000),
                'customer_history_check' => true,
                'fraud_score_limit' => $this->faker->numberBetween(1, 10),
                'supporting_documents_required' => $this->faker->boolean()
            ], $this->faker->numberBetween(1, 3)),
            
            'auto_approval_rules' => function (array $attributes) {
                if ($attributes['step_name'] === 'initial_review') {
                    return [
                        'max_amount' => 50000, // Auto-approve up to IDR 500
                        'allowed_reason_categories' => ['duplicate_payment'],
                        'customer_tier' => ['premium', 'vip']
                    ];
                }
                return null;
            },
            'requires_manual_review' => $this->faker->boolean(70),
            
            // Notification tracking
            'notification_sent' => $this->faker->boolean(60),
            'notification_sent_at' => function (array $attributes) {
                return $attributes['notification_sent'] 
                    ? $this->faker->dateTimeBetween($attributes['assigned_at'], 'now')
                    : null;
            },
            'notification_channels' => $this->faker->optional(0.8)->randomElements([
                'email', 'sms', 'in_app', 'slack', 'webhook'
            ], $this->faker->numberBetween(1, 2)),
            'reminder_count' => $this->faker->numberBetween(0, 3),
            'last_reminder_sent_at' => function (array $attributes) {
                return $attributes['reminder_count'] > 0
                    ? $this->faker->dateTimeBetween($attributes['assigned_at'], 'now')
                    : null;
            },
            
            // Business logic
            'refund_amount_threshold' => function () {
                return $this->faker->randomElement([
                    50000,   // IDR 500 (low threshold)
                    250000,  // IDR 2,500 (medium threshold)
                    1000000, // IDR 10,000 (high threshold)
                    null
                ]);
            },
            'risk_assessment' => $this->faker->optional(0.4)->randomElements([
                'customer_risk_score' => $this->faker->numberBetween(1, 10),
                'transaction_risk_score' => $this->faker->numberBetween(1, 10),
                'fraud_indicators' => $this->faker->randomElements([
                    'suspicious_pattern', 'high_frequency', 'unusual_amount'
                ], $this->faker->numberBetween(0, 2)),
                'customer_history' => $this->faker->randomElement(['good', 'average', 'poor'])
            ]),
            'requires_additional_documentation' => $this->faker->boolean(30),
            'required_documents' => function (array $attributes) {
                return $attributes['requires_additional_documentation'] ? 
                    $this->faker->randomElements([
                        'receipt_copy',
                        'photo_evidence',
                        'customer_statement',
                        'bank_statement',
                        'shipping_proof'
                    ], $this->faker->numberBetween(1, 3)) : null;
            },
        ];
    }

    /**
     * Configure the model factory for pending workflows
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'decision' => 'pending',
            'is_current_step' => true,
            'is_completed' => false,
            'decided_by' => null,
            'decided_at' => null,
        ]);
    }

    /**
     * Configure the model factory for approved workflows
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'decision' => 'approved',
            'is_current_step' => false,
            'is_completed' => true,
            'decided_by' => UserEloquentModel::factory(),
            'decided_at' => $this->faker->dateTimeBetween($attributes['assigned_at'], 'now'),
            'decision_reason' => 'Refund request meets all criteria and has been approved.',
            'decision_ip_address' => $this->faker->ipv4(),
            'decision_user_agent' => $this->faker->userAgent(),
        ]);
    }

    /**
     * Configure the model factory for rejected workflows
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'decision' => 'rejected',
            'is_current_step' => false,
            'is_completed' => true,
            'decided_by' => UserEloquentModel::factory(),
            'decided_at' => $this->faker->dateTimeBetween($attributes['assigned_at'], 'now'),
            'decision_reason' => $this->faker->randomElement([
                'Insufficient documentation provided',
                'Refund policy violation',
                'Suspected fraudulent activity',
                'Customer history indicates abuse',
                'Technical requirements not met'
            ]),
            'decision_ip_address' => $this->faker->ipv4(),
            'decision_user_agent' => $this->faker->userAgent(),
        ]);
    }

    /**
     * Configure the model factory for escalated workflows
     */
    public function escalated(): static
    {
        return $this->state(fn (array $attributes) => [
            'decision' => 'escalated',
            'is_current_step' => true, // Still active but escalated
            'is_completed' => false,
            'escalated_to' => UserEloquentModel::factory(),
            'escalated_at' => $this->faker->dateTimeBetween($attributes['assigned_at'], 'now'),
            'escalation_reason' => $this->faker->randomElement([
                'SLA breach - requires immediate attention',
                'High value transaction needs senior approval',
                'Complex case requiring specialist review',
                'Conflict of interest with assigned approver'
            ]),
        ]);
    }

    /**
     * Configure the model factory for overdue workflows
     */
    public function overdue(): static
    {
        $pastDueDate = $this->faker->dateTimeBetween('-3 days', '-1 day');
        
        return $this->state(fn (array $attributes) => [
            'assigned_at' => $pastDueDate,
            'due_at' => $this->faker->dateTimeBetween($pastDueDate, '-1 hour'),
            'is_overdue' => true,
            'sla_breached' => true,
            'reminder_count' => $this->faker->numberBetween(1, 5),
            'last_reminder_sent_at' => $this->faker->dateTimeBetween('-1 day', 'now'),
        ]);
    }

    /**
     * Configure the model factory for high-value workflows
     */
    public function highValue(): static
    {
        return $this->state(fn (array $attributes) => [
            'approval_level' => 'high',
            'refund_amount_threshold' => 1000000, // IDR 10,000
            'requires_manual_review' => true,
            'requires_additional_documentation' => true,
            'sla_hours' => 72, // Longer SLA for high-value refunds
            'required_documents' => [
                'receipt_copy',
                'photo_evidence', 
                'customer_statement',
                'manager_approval'
            ],
        ]);
    }

    /**
     * Configure the model factory for auto-approval eligible workflows
     */
    public function autoApproval(): static
    {
        return $this->state(fn (array $attributes) => [
            'approval_level' => 'low',
            'refund_amount_threshold' => 50000, // IDR 500
            'requires_manual_review' => false,
            'auto_approval_rules' => [
                'max_amount' => 50000,
                'allowed_reason_categories' => ['duplicate_payment', 'order_cancellation'],
                'customer_tier' => ['premium', 'vip']
            ],
            'sla_hours' => 4, // Fast track
        ]);
    }
}