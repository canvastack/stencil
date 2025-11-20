<?php

namespace App\Domain\Payment\Services;

use App\Models\PaymentRefund;
use App\Models\RefundApprovalWorkflow;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\RoleEloquentModel;
use App\Domain\Payment\Enums\RefundReasonCategory;
use App\Domain\Payment\Enums\WorkflowDecision;
use App\Domain\Payment\Events\RefundWorkflowStepAssigned;
use App\Domain\Payment\Events\RefundWorkflowStepCompleted;
use App\Domain\Payment\Events\RefundWorkflowEscalated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class RefundApprovalService
{
    /**
     * Initialize approval workflow for a refund
     */
    public function initializeWorkflow(PaymentRefund $refund): void
    {
        $workflowSteps = $this->determineWorkflowSteps($refund);

        DB::transaction(function () use ($refund, $workflowSteps) {
            foreach ($workflowSteps as $index => $step) {
                RefundApprovalWorkflow::create([
                    'tenant_id' => $refund->tenant_id,
                    'payment_refund_id' => $refund->id,
                    'order_id' => $refund->order_id,
                    'workflow_name' => $step['workflow_name'],
                    'step_number' => $index + 1,
                    'total_steps' => count($workflowSteps),
                    'is_current_step' => $index === 0, // First step is current
                    'step_name' => $step['step_name'],
                    'step_description' => $step['step_description'],
                    'step_type' => $step['step_type'],
                    'approval_level' => $step['approval_level'],
                    'assigned_to' => $step['assigned_to'],
                    'role_required' => $step['role_required'] ?? null,
                    'permission_requirements' => $step['permission_requirements'] ?? null,
                    'assigned_at' => now(),
                    'due_at' => now()->addHours($step['sla_hours']),
                    'sla_hours' => $step['sla_hours'],
                    'approval_conditions' => $step['approval_conditions'] ?? null,
                    'auto_approval_rules' => $step['auto_approval_rules'] ?? null,
                    'requires_manual_review' => $step['requires_manual_review'] ?? true,
                    'refund_amount_threshold' => $step['refund_amount_threshold'] ?? null,
                    'risk_assessment' => $step['risk_assessment'] ?? null,
                ]);
            }

            // Send notification for first step
            if (!empty($workflowSteps)) {
                $firstStep = RefundApprovalWorkflow::where('payment_refund_id', $refund->id)
                    ->where('step_number', 1)
                    ->first();
                    
                if ($firstStep) {
                    $this->sendWorkflowNotification($firstStep);
                    event(new RefundWorkflowStepAssigned($firstStep, $firstStep->assigned_to));
                }
            }
        });

        Log::info('Refund approval workflow initialized', [
            'refund_id' => $refund->id,
            'total_steps' => count($workflowSteps),
        ]);
    }

    /**
     * Complete current workflow step with decision
     */
    public function completeCurrentStep(PaymentRefund $refund, string $decision, int $decidedBy, string $reason = null): void
    {
        $currentStep = $refund->getCurrentWorkflowStep();
        
        if (!$currentStep) {
            throw new \InvalidArgumentException('No active workflow step found');
        }

        DB::transaction(function () use ($currentStep, $decision, $decidedBy, $reason, $refund) {
            $decisionEnum = WorkflowDecision::fromString($decision);

            // Update current step
            $currentStep->update([
                'decision' => $decision,
                'decided_by' => $decidedBy,
                'decided_at' => now(),
                'decision_reason' => $reason,
                'decision_ip_address' => request()?->ip(),
                'decision_user_agent' => request()?->userAgent(),
                'is_completed' => true,
                'is_current_step' => false,
            ]);

            // Fire step completion event
            event(new RefundWorkflowStepCompleted($currentStep, $decision, $decidedBy));

            if ($decisionEnum->isPositive()) {
                // Move to next step or complete workflow
                $this->advanceWorkflow($refund);
            } else {
                // Workflow rejected - no further steps
                $this->completeWorkflow($refund, false);
            }
        });

        Log::info('Workflow step completed', [
            'refund_id' => $refund->id,
            'step_number' => $currentStep->step_number,
            'decision' => $decision,
            'decided_by' => $decidedBy,
        ]);
    }

    /**
     * Escalate workflow step to higher authority
     */
    public function escalateWorkflowStep(RefundApprovalWorkflow $workflowStep, int $escalatedToUserId, string $reason): void
    {
        if (!$workflowStep->canBeEscalated()) {
            throw new ValidationException(['workflow' => 'This workflow step cannot be escalated']);
        }

        $workflowStep->escalate($escalatedToUserId, $reason);

        // Send notification to escalated user
        $this->sendWorkflowNotification($workflowStep);

        // Fire escalation event
        event(new RefundWorkflowEscalated($workflowStep, $escalatedToUserId, $reason));

        Log::info('Workflow step escalated', [
            'workflow_id' => $workflowStep->id,
            'escalated_to' => $escalatedToUserId,
            'reason' => $reason,
        ]);
    }

    /**
     * Get pending workflow items for a user
     */
    public function getPendingWorkflowItems(int $userId): \Illuminate\Database\Eloquent\Collection
    {
        return RefundApprovalWorkflow::where('assigned_to', $userId)
            ->where('is_current_step', true)
            ->where('decision', 'pending')
            ->with(['paymentRefund.order', 'paymentRefund.customer'])
            ->orderBy('due_at')
            ->get();
    }

    /**
     * Get overdue workflow items for notifications
     */
    public function getOverdueWorkflowItems(): \Illuminate\Database\Eloquent\Collection
    {
        return RefundApprovalWorkflow::where('is_current_step', true)
            ->where('decision', 'pending')
            ->where('due_at', '<', now())
            ->where('is_overdue', false)
            ->get();
    }

    /**
     * Process overdue workflow items
     */
    public function processOverdueWorkflows(): int
    {
        $overdueItems = $this->getOverdueWorkflowItems();
        $processedCount = 0;

        foreach ($overdueItems as $workflow) {
            // Mark as overdue
            $workflow->update([
                'is_overdue' => true,
                'sla_breached' => true
            ]);

            // Send reminder notification
            $this->sendWorkflowReminder($workflow);

            // Auto-escalate if configured
            if ($this->shouldAutoEscalate($workflow)) {
                $escalationUser = $this->findEscalationUser($workflow);
                if ($escalationUser) {
                    $this->escalateWorkflowStep(
                        $workflow, 
                        $escalationUser->id, 
                        'Auto-escalated due to SLA breach'
                    );
                }
            }

            $processedCount++;
        }

        if ($processedCount > 0) {
            Log::info('Processed overdue workflow items', [
                'count' => $processedCount
            ]);
        }

        return $processedCount;
    }

    /**
     * Determine workflow steps based on refund characteristics
     */
    protected function determineWorkflowSteps(PaymentRefund $refund): array
    {
        $reasonCategory = RefundReasonCategory::fromString($refund->reason_category);
        $approvalLevel = $reasonCategory->getApprovalLevel();
        $refundAmount = $refund->refund_amount;

        // Base workflow configuration
        $steps = [];

        // Step 1: Initial Review (always required)
        $steps[] = [
            'workflow_name' => 'standard_refund_approval',
            'step_name' => 'initial_review',
            'step_description' => 'Initial review of refund request and documentation',
            'step_type' => 'review',
            'approval_level' => 'low',
            'assigned_to' => $this->findApproverByRole('customer_service'),
            'sla_hours' => 24,
            'requires_manual_review' => true,
            'auto_approval_rules' => $this->getAutoApprovalRules($refund),
        ];

        // Step 2: Manager Approval (for medium+ approval levels or high amounts)
        if ($approvalLevel !== 'low' || $refundAmount >= 250000) { // IDR 2,500+
            $steps[] = [
                'workflow_name' => 'standard_refund_approval',
                'step_name' => 'manager_approval',
                'step_description' => 'Manager review and approval',
                'step_type' => 'approval',
                'approval_level' => 'medium',
                'assigned_to' => $this->findApproverByRole('manager'),
                'sla_hours' => 48,
                'requires_manual_review' => true,
                'refund_amount_threshold' => 250000,
            ];
        }

        // Step 3: Finance Approval (for high amounts or finance-related issues)
        if ($refundAmount >= 1000000 || $approvalLevel === 'high') { // IDR 10,000+
            $steps[] = [
                'workflow_name' => 'high_value_refund_approval',
                'step_name' => 'finance_approval',
                'step_description' => 'Finance team approval for high-value refund',
                'step_type' => 'approval',
                'approval_level' => 'high',
                'assigned_to' => $this->findApproverByRole('finance_manager'),
                'sla_hours' => 72,
                'requires_manual_review' => true,
                'refund_amount_threshold' => 1000000,
                'approval_conditions' => [
                    'requires_supporting_documents' => true,
                    'requires_customer_verification' => true,
                ],
            ];
        }

        // Step 4: Executive Approval (for very high amounts)
        if ($refundAmount >= 5000000) { // IDR 50,000+
            $steps[] = [
                'workflow_name' => 'executive_refund_approval',
                'step_name' => 'executive_approval',
                'step_description' => 'Executive approval for very high-value refund',
                'step_type' => 'approval',
                'approval_level' => 'critical',
                'assigned_to' => $this->findApproverByRole('executive'),
                'sla_hours' => 96,
                'requires_manual_review' => true,
                'refund_amount_threshold' => 5000000,
            ];
        }

        return $steps;
    }

    /**
     * Find approver by role
     */
    protected function findApproverByRole(string $roleName): int
    {
        $tenantId = app('current_tenant')->id;
        
        // Find users with the required role in current tenant
        $role = RoleEloquentModel::where('tenant_id', $tenantId)
            ->where('slug', $roleName)
            ->first();

        if (!$role) {
            // Fallback to admin role
            $role = RoleEloquentModel::where('tenant_id', $tenantId)
                ->where('slug', 'admin')
                ->first();
        }

        if ($role) {
            // Get first user with this role
            $user = UserEloquentModel::where('tenant_id', $tenantId)
                ->whereHas('roles', function ($q) use ($role) {
                    $q->where('role_id', $role->id);
                })
                ->first();

            if ($user) {
                return $user->id;
            }
        }

        // Ultimate fallback - get any admin user
        $adminUser = UserEloquentModel::where('tenant_id', $tenantId)
            ->whereHas('roles', function ($q) {
                $q->where('slug', 'admin');
            })
            ->first();

        return $adminUser?->id ?? auth()->id();
    }

    /**
     * Get auto-approval rules for initial step
     */
    protected function getAutoApprovalRules(PaymentRefund $refund): ?array
    {
        $reasonCategory = RefundReasonCategory::fromString($refund->reason_category);

        // Auto-approval rules for specific categories
        if (in_array($reasonCategory, [RefundReasonCategory::DUPLICATE_PAYMENT, RefundReasonCategory::ORDER_CANCELLATION])) {
            return [
                'max_amount' => 100000, // IDR 1,000
                'allowed_reason_categories' => ['duplicate_payment', 'order_cancellation'],
                'requires_no_dispute' => true,
            ];
        }

        return null;
    }

    /**
     * Advance workflow to next step
     */
    protected function advanceWorkflow(PaymentRefund $refund): void
    {
        $nextStep = RefundApprovalWorkflow::where('payment_refund_id', $refund->id)
            ->where('is_completed', false)
            ->where('step_number', '>', $refund->getCurrentWorkflowStep()?->step_number ?? 0)
            ->orderBy('step_number')
            ->first();

        if ($nextStep) {
            // Activate next step
            $nextStep->update([
                'is_current_step' => true,
                'assigned_at' => now(),
                'due_at' => now()->addHours($nextStep->sla_hours),
            ]);

            // Send notification
            $this->sendWorkflowNotification($nextStep);
            event(new RefundWorkflowStepAssigned($nextStep, $nextStep->assigned_to));

            Log::info('Workflow advanced to next step', [
                'refund_id' => $refund->id,
                'step_number' => $nextStep->step_number,
            ]);
        } else {
            // No more steps - workflow complete
            $this->completeWorkflow($refund, true);
        }
    }

    /**
     * Complete entire workflow
     */
    protected function completeWorkflow(PaymentRefund $refund, bool $approved): void
    {
        // Mark all remaining steps as completed
        RefundApprovalWorkflow::where('payment_refund_id', $refund->id)
            ->where('is_completed', false)
            ->update([
                'is_completed' => true,
                'is_current_step' => false,
            ]);

        if ($approved) {
            // Auto-approve the refund
            $refund->markAsApproved(auth()->id());
        }

        Log::info('Refund workflow completed', [
            'refund_id' => $refund->id,
            'approved' => $approved,
        ]);
    }

    /**
     * Send workflow notification
     */
    protected function sendWorkflowNotification(RefundApprovalWorkflow $workflow): void
    {
        // Implementation would send email/in-app notification
        // For now, just mark notification as sent
        $workflow->markNotificationSent(['email', 'in_app']);
    }

    /**
     * Send workflow reminder
     */
    protected function sendWorkflowReminder(RefundApprovalWorkflow $workflow): void
    {
        $workflow->sendReminderNotification();
    }

    /**
     * Check if workflow should auto-escalate
     */
    protected function shouldAutoEscalate(RefundApprovalWorkflow $workflow): bool
    {
        // Auto-escalate after 48 hours of being overdue
        return $workflow->due_at->diffInHours(now()) > 48;
    }

    /**
     * Find escalation user
     */
    protected function findEscalationUser(RefundApprovalWorkflow $workflow): ?UserEloquentModel
    {
        // Find higher authority based on current approval level
        $escalationRole = match ($workflow->approval_level) {
            'low' => 'manager',
            'medium' => 'finance_manager',
            'high' => 'executive',
            default => 'admin',
        };

        return UserEloquentModel::where('tenant_id', $workflow->tenant_id)
            ->whereHas('roles', function ($q) use ($escalationRole) {
                $q->where('slug', $escalationRole);
            })
            ->first();
    }
}